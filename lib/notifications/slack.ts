import { getSupabaseService } from '../supabaseClient';

/**
 * Mirror the Discord command execution to Slack using the configured server webhook.
 * This runs asynchronously (via waitUntil) and does not block the Discord 3-second window.
 */
export async function sendSlackMirrorNotification(
  guildId: string | null,
  commandName: string,
  replyText: string,
  interactionId: string
): Promise<void> {
  if (!guildId) {
    return;
  }

  const supabaseService = getSupabaseService();

  try {
    // 1. Fetch server config to retrieve the Slack webhook (using service role to bypass RLS)
    const { data: serverData, error: serverError } = await supabaseService
      .from('servers')
      .select('mirror_webhook_url')
      .eq('guild_id', guildId)
      .maybeSingle();

    if (serverError) {
      console.error(`[Slack Mirror] Failed to query server for guild_id ${guildId}:`, serverError);
      return;
    }

    if (!serverData || !serverData.mirror_webhook_url) {
      // Skip silently if server configuration or webhook does not exist
      return;
    }

    const webhookUrl = serverData.mirror_webhook_url;

    // 2. Format a clean message payload
    const slackPayload = {
      text: `🤖 *Discord Command Mirror: \`/${commandName}\`*\n*Interaction ID:* \`${interactionId}\`\n\n*Response:*\n${replyText}`,
    };

    // 3. POST to Slack webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(slackPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[Slack Mirror] Webhook returned status ${response.status}: ${errorBody}`);
      
      // Update command log to failed
      await supabaseService
        .from('command_logs')
        .update({ mirror_status: 'failed' })
        .eq('interaction_id', interactionId);
      return;
    }

    // 4. Update command log to delivered
    await supabaseService
      .from('command_logs')
      .update({ mirror_status: 'delivered' })
      .eq('interaction_id', interactionId);

    console.log(`[Slack Mirror] Successfully mirrored command ${commandName} (interaction: ${interactionId})`);

  } catch (error) {
    console.error(`[Slack Mirror] Unexpected error mirroring command:`, error);
    
    // Update command log to failed in case of network/fetch errors
    try {
      await supabaseService
        .from('command_logs')
        .update({ mirror_status: 'failed' })
        .eq('interaction_id', interactionId);
    } catch (dbError) {
      console.error('[Slack Mirror] Failed to update mirror_status to failed:', dbError);
    }
  }
}
