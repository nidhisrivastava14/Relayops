import { triageIncident, IncidentCategory } from '../ai/triage';
import { supabase } from '../supabaseClient';

export interface CommandResult {
  replyText: string;
  actionTaken: string;
  incidentStatus: 'open' | 'resolved' | null;
  category?: IncidentCategory;
  priority?: 'Low' | 'Medium' | 'High';
  aiSummary?: string;
}

/**
 * Handles the /report command.
 */
export async function handleReportCommand(
  inputText: string | null,
  userId: string,
  serverId: string | null,
  guildId: string | null
): Promise<CommandResult> {
  void serverId;
  void guildId;

  if (!inputText || inputText.trim() === '') {
    throw new Error('Please provide the details of the incident. Usage: /report <text>');
  }

  // Perform AI Triage analysis using Gemini 1.5 Flash
  const triage = await triageIncident(inputText);

  const replyText = `🚨 **New Incident Report**
**User:** <@${userId}>
**Original Report:** ${inputText}

**AI Triage Analysis:**
• **Category:** \`${triage.category}\`
• **Priority:** \`${triage.priority}\`
• **Summary:** ${triage.summary}`;

  return {
    replyText,
    actionTaken: 'created_report',
    incidentStatus: 'open',
    category: triage.category,
    priority: triage.priority,
    aiSummary: triage.summary,
  };
}

/**
 * Handles the /status command.
 */
export async function handleStatusCommand(
  userId: string,
  serverId: string | null,
  guildId: string | null
): Promise<CommandResult> {
  // Query open reports in this guild/server
  let query = supabase
    .from('command_logs')
    .select('id', { count: 'exact', head: true })
    .eq('command_name', 'report')
    .eq('action_taken', 'created_report')
    .eq('incident_status', 'open');

  if (guildId) {
    query = query.eq('guild_id', guildId);
  } else if (serverId) {
    query = query.eq('server_id', serverId);
  }

  const { count, error } = await query;

  if (error) {
    console.error('Error fetching open incident count:', error);
    throw new Error('Could not retrieve incident status at this time.');
  }

  const openCount = count || 0;

  return {
    replyText: `📊 **Incident Status Report**:\nThere are currently **${openCount}** open report(s) in this server.`,
    actionTaken: 'status_lookup',
    incidentStatus: null,
  };
}
