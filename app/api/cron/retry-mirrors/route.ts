import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Verify Vercel Cron secret
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const supabase = supabaseAdmin;

  try {
    // 2. Fetch up to 20 failed logs that haven't hit max retries (retry_count < 5)
    // If retry_count is null in DB, it is evaluated as 0 in queries.
    const { data: failedLogs, error: logsError } = await supabase
      .from('command_logs')
      .select('*')
      .eq('mirror_status', 'failed')
      .lt('retry_count', 5)
      .order('created_at', { ascending: true })
      .limit(20);

    if (logsError) {
      console.error('[Cron Retry] Failed to query failed logs:', logsError);
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    if (!failedLogs || failedLogs.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No failed mirrors to retry' });
    }

    let successCount = 0;
    let failCount = 0;

    for (const log of failedLogs) {
      const currentRetry = log.retry_count || 0;
      const nextRetry = currentRetry + 1;

      try {
        // 3. Fetch server config to retrieve webhook url
        const { data: serverData, error: serverError } = await supabase
          .from('servers')
          .select('mirror_webhook_url')
          .eq('guild_id', log.guild_id)
          .maybeSingle();

        if (serverError || !serverData?.mirror_webhook_url) {
          console.error(`[Cron Retry] Webhook url lookup failed for guild: ${log.guild_id}`, serverError);
          const status = nextRetry >= 5 ? 'abandoned' : 'failed';
          await supabase
            .from('command_logs')
            .update({ retry_count: nextRetry, mirror_status: status })
            .eq('id', log.id);
          failCount++;
          continue;
        }

        // 4. Construct Slack mirror payload
        let messageText = `🤖 *Discord Command Mirror: \`/${log.command_name}\`* (Retry Attempt #${nextRetry})\n`;
        messageText += `*Interaction ID:* \`${log.interaction_id}\`\n`;
        messageText += `*User ID:* \`${log.user_id}\`\n`;

        if (log.input_text) {
          messageText += `*Input:* \`${log.input_text}\`\n`;
        }
        if (log.category) {
          messageText += `*AI Triage Category:* \`${log.category}\` | *Priority:* \`${log.priority}\`\n`;
        }
        if (log.ai_summary) {
          messageText += `*AI Summary:* ${log.ai_summary}\n`;
        }
        if (log.incident_status) {
          messageText += `*Incident Status:* \`${log.incident_status}\`\n`;
        }

        const slackPayload = { text: messageText };

        // 5. POST to Slack webhook
        const response = await fetch(serverData.mirror_webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slackPayload),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[Cron Retry] Slack returned error status ${response.status}: ${errText}`);
          const status = nextRetry >= 5 ? 'abandoned' : 'failed';
          await supabase
            .from('command_logs')
            .update({ retry_count: nextRetry, mirror_status: status })
            .eq('id', log.id);
          failCount++;
        } else {
          // Success
          await supabase
            .from('command_logs')
            .update({ retry_count: nextRetry, mirror_status: 'delivered' })
            .eq('id', log.id);
          successCount++;
        }
      } catch (innerErr) {
        console.error(`[Cron Retry] Unexpected error processing log id ${log.id}:`, innerErr);
        const status = nextRetry >= 5 ? 'abandoned' : 'failed';
        await supabase
          .from('command_logs')
          .update({ retry_count: nextRetry, mirror_status: status })
          .eq('id', log.id);
        failCount++;
      }
    }

    return NextResponse.json({
      processed: failedLogs.length,
      successCount,
      failCount,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Cron Retry] Unexpected outer error:', err);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
