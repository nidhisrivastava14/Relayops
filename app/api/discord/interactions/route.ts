import { verifyDiscordRequest } from '@/lib/discord/verify';
import { pongResponse, channelMessageResponse, errorResponse, deferredResponse, updateMessageResponse } from '@/lib/discord/response';
import { handleReportCommand, handleStatusCommand } from '@/lib/commands/handlers';
import { supabase } from '@/lib/supabaseClient';
import { waitUntil } from '@vercel/functions';
import { sendSlackMirrorNotification } from '@/lib/notifications/slack';

interface DiscordInteractionOption {
  name: string;
  type: number;
  value: string | number | boolean;
}

interface DiscordInteractionData {
  name?: string;
  options?: DiscordInteractionOption[];
  custom_id?: string;
  component_type?: number;
}

interface DiscordUser {
  id: string;
  username: string;
}

interface DiscordMember {
  user?: DiscordUser;
}

interface DiscordMessage {
  content: string;
  id: string;
}

interface DiscordInteraction {
  type: number;
  id: string;
  token: string;
  data?: DiscordInteractionData;
  guild_id?: string;
  member?: DiscordMember;
  user?: DiscordUser;
  message?: DiscordMessage;
}

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;
  if (!publicKey) {
    console.error('DISCORD_PUBLIC_KEY is not set in environment variables');
    return new Response('Server configuration error', { status: 500 });
  }

  // 1. Verify signature using raw body and headers
  const { isValid, rawBody } = await verifyDiscordRequest(request, publicKey);
  if (!isValid) {
    console.warn('Invalid signature from incoming request');
    return new Response('Invalid signature', { status: 401 });
  }

  // 2. Signature verification succeeded, safe to parse JSON
  let body: DiscordInteraction;
  try {
    body = JSON.parse(rawBody) as DiscordInteraction;
  } catch (error) {
    console.error('Failed to parse interaction JSON body:', error);
    return new Response('Malformed JSON body', { status: 400 });
  }

  const { type, id: interactionId, data, guild_id: guildId } = body;

  // 3. Handle PING (type === 1)
  if (type === 1) {
    return pongResponse();
  }

  // 4. Handle APPLICATION_COMMAND (type === 2)
  if (type === 2) {
    const commandName = data?.name;
    const userId = body.member?.user?.id || body.user?.id;
    const token = body.token;

    if (!interactionId || !commandName || !userId || !token) {
      console.warn('Malformed command interaction body received');
      return errorResponse('Malformed interaction payload');
    }

    // Determine the option values (specifically 'text' option for report command)
    const textOption = data?.options?.find((opt: DiscordInteractionOption) => opt.name === 'text');
    const inputText = textOption ? String(textOption.value) : null;

    // Check if the server exists in the DB (keep server_id null if not registered yet, do NOT auto-create)
    let serverId: string | null = null;
    if (guildId) {
      const { data: serverData } = await supabase
        .from('servers')
        .select('id')
        .eq('guild_id', guildId)
        .single();
      if (serverData) {
        serverId = serverData.id;
      }
    }

    // DEDUP FIRST: Insert 'received' status row. If duplicate, unique key constraint handles it.
    const { error: insertError } = await supabase
      .from('command_logs')
      .insert({
        interaction_id: interactionId,
        server_id: serverId,
        guild_id: guildId,
        command_name: commandName,
        user_id: userId,
        input_text: inputText,
        status: 'received',
      });

    if (insertError) {
      // Check for Postgres Unique Violation error code
      if (insertError.code === '23505') {
        console.log(`Duplicate interaction detected: ${interactionId}`);
        return channelMessageResponse('This request has already been processed (duplicate interaction).');
      }
      console.error('Failed to insert command log durability row:', insertError);
      return errorResponse('Failed to log command interaction.');
    }

    // Handle report command asynchronously (deferred response)
    if (commandName === 'report') {
      const response = deferredResponse();

      waitUntil(
        (async () => {
          try {
            const result = await handleReportCommand(inputText, userId, serverId, guildId || null);

            // Update command log to completed with triage details
            await supabase
              .from('command_logs')
              .update({
                status: 'completed',
                action_taken: result.actionTaken,
                incident_status: result.incidentStatus,
                category: result.category,
                priority: result.priority,
                ai_summary: result.aiSummary,
                mirror_status: guildId ? 'pending' : null,
              })
              .eq('interaction_id', interactionId);

            // Define button components
            const resolveButtonComponent = [
              {
                type: 1, // ACTION_ROW
                components: [
                  {
                    type: 2, // BUTTON
                    style: 3, // SUCCESS (Green)
                    label: 'Resolve',
                    custom_id: `resolve_${interactionId}`,
                  },
                ],
              },
            ];

            const appId = process.env.DISCORD_APPLICATION_ID;
            if (!appId) {
              throw new Error('DISCORD_APPLICATION_ID is not configured.');
            }

            const discordPatchUrl = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
            const patchRes = await fetch(discordPatchUrl, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: result.replyText,
                components: resolveButtonComponent,
              }),
            });

            if (!patchRes.ok) {
              const errBody = await patchRes.text();
              console.error(`[Deferred Report] Follow-up PATCH failed (${patchRes.status}): ${errBody}`);
            }

            // Mirror to Slack
            if (guildId) {
              await sendSlackMirrorNotification(guildId, commandName, result.replyText, interactionId);
            }
          } catch (handlerError: unknown) {
            const err = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
            console.error('[Deferred Report] Background task error:', err);

            await supabase
              .from('command_logs')
              .update({
                status: 'failed',
                action_taken: 'created_report',
                incident_status: null,
              })
              .eq('interaction_id', interactionId);

            // Send fallback follow-up
            try {
              const appId = process.env.DISCORD_APPLICATION_ID || '';
              const discordPatchUrlFallback = `https://discord.com/api/v10/webhooks/${appId}/${token}/messages/@original`;
              await fetch(discordPatchUrlFallback, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: `⚠️ Failed to process report: ${err.message}`,
                }),
              });
            } catch (patchErr) {
              console.error('[Deferred Report] Failed to send fallback PATCH:', patchErr);
            }
          }
        })()
      );

      return response;
    }

    // Handle status command synchronously
    if (commandName === 'status') {
      try {
        const result = await handleStatusCommand(userId, serverId, guildId || null);

        await supabase
          .from('command_logs')
          .update({
            status: 'completed',
            action_taken: result.actionTaken,
            incident_status: result.incidentStatus,
            mirror_status: guildId ? 'pending' : null,
          })
          .eq('interaction_id', interactionId);

        if (guildId) {
          waitUntil(
            sendSlackMirrorNotification(guildId, commandName, result.replyText, interactionId)
          );
        }

        return channelMessageResponse(result.replyText);
      } catch (handlerError: unknown) {
        const err = handlerError instanceof Error ? handlerError : new Error(String(handlerError));
        console.error(`Error running command /${commandName}:`, err);

        await supabase
          .from('command_logs')
          .update({
            status: 'failed',
            action_taken: null,
            incident_status: null,
          })
          .eq('interaction_id', interactionId);

        return channelMessageResponse(`❌ Failed to run command: ${err.message}`);
      }
    }
  }

  // 5. Handle MESSAGE_COMPONENT (type === 3)
  if (type === 3) {
    const customId = data?.custom_id;
    const userId = body.member?.user?.id || body.user?.id;
    const token = body.token;

    if (!interactionId || !customId || !userId || !token) {
      console.warn('Malformed message component interaction body received');
      return errorResponse('Malformed interaction payload');
    }

    if (customId.startsWith('resolve_')) {
      const reportInteractionId = customId.replace('resolve_', '');

      // DEDUP click: Insert log row for this click to prevent duplicate resolve actions
      const { error: clickInsertError } = await supabase
        .from('command_logs')
        .insert({
          interaction_id: interactionId,
          guild_id: guildId,
          command_name: 'resolve_click',
          user_id: userId,
          status: 'received',
        });

      if (clickInsertError) {
        if (clickInsertError.code === '23505') {
          console.log(`Duplicate resolve click detected: ${interactionId}`);
          return updateMessageResponse(body.message?.content || 'Incident resolved.');
        }
        console.error('Failed to log click interaction:', clickInsertError);
        return errorResponse('Failed to log resolve interaction.');
      }

      try {
        // Update original report log to resolved
        const { error: updateErr } = await supabase
          .from('command_logs')
          .update({ incident_status: 'resolved' })
          .eq('interaction_id', reportInteractionId);

        if (updateErr) {
          throw new Error(`Failed to update incident log status: ${updateErr.message}`);
        }

        const originalContent = body.message?.content || '';
        const updatedContent = originalContent.includes('✅ Resolved')
          ? originalContent
          : `${originalContent}\n\n✅ **Resolved**`;

        // Update click log to completed
        await supabase
          .from('command_logs')
          .update({
            status: 'completed',
            action_taken: 'resolved_click',
          })
          .eq('interaction_id', interactionId);

        return updateMessageResponse(updatedContent, []); // empty components removes the button
      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error('Error resolving incident:', error);

        await supabase
          .from('command_logs')
          .update({ status: 'failed' })
          .eq('interaction_id', interactionId);

        return channelMessageResponse(`❌ Failed to resolve incident: ${error.message}`);
      }
    }
  }

  // Unsupported interaction types
  return channelMessageResponse('Phase 4 stub — unsupported interaction type.');
}
