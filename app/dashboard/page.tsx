'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClientInstance } from '@/lib/supabase/browser';
import { MirrorStatus } from '@/lib/types';
import { Hero } from '@/components/dashboard/hero';
import { MetricCard } from '@/components/dashboard/metric-card';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { HealthPanel } from '@/components/dashboard/health-panel';
import { Terminal, AlertTriangle, CheckCircle2, BrainCircuit } from 'lucide-react';
import { fetchDashboardMetrics, getPriorityDistribution } from '@/lib/data-queries';

interface ServerRow {
  id: string;
  guild_id: string;
  channel_id: string;
  mirror_webhook_url: string | null;
  admin_user_id: string | null;
  created_at: string;
}

interface CommandLog {
  id: string;
  interaction_id: string;
  server_id: string | null;
  guild_id: string | null;
  command_name: string;
  user_id: string;
  input_text: string | null;
  status: 'received' | 'completed' | 'failed';
  action_taken: string | null;
  incident_status: 'open' | 'resolved' | null;
  mirror_status: MirrorStatus;
  category: string | null;
  priority: string | null;
  ai_summary: string | null;
  created_at: string;
}

export default function DashboardOverviewPage() {
  const supabase = createBrowserClientInstance();
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('admin@relayops.com');

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserEmail(user.email || 'admin@relayops.com');

      // 1. Fetch servers configured by this admin
      const { data: serversData, error: serversErr } = await supabase
        .from('servers')
        .select('*')
        .eq('admin_user_id', user.id);

      if (serversErr) {
        console.error('Error fetching servers:', serversErr);
        return;
      }

      setServers(serversData || []);

      if (serversData && serversData.length > 0) {
        const guildIds = serversData.map((s) => s.guild_id);

        // 2. Fetch recent command logs for these servers
        const { data: logsData, error: logsErr } = await supabase
          .from('command_logs')
          .select('*')
          .in('guild_id', guildIds)
          .order('created_at', { ascending: false })
          .limit(100);

        if (logsErr) {
          console.error('Error fetching logs:', logsErr);
        } else {
          setLogs(logsData || []);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Set up Realtime Subscription for command_logs table
  useEffect(() => {
    if (servers.length === 0) return;

    const channel = supabase
      .channel('dashboard-live-logs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'command_logs',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newLog = payload.new as CommandLog;
            const isOurLog = servers.some((s) => s.guild_id === newLog.guild_id);
            if (isOurLog) {
              setLogs((prev) => [newLog, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedLog = payload.new as CommandLog;
            const isOurLog = servers.some((s) => s.guild_id === updatedLog.guild_id);
            if (isOurLog) {
              setLogs((prev) =>
                prev.map((log) => (log.id === updatedLog.id ? updatedLog : log))
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [servers, supabase]);

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <svg className="animate-spin h-8 w-8 text-violet-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading metrics & logs...</span>
      </div>
    );
  }

  // If no servers are configured by this admin yet
  if (servers.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto mt-12">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-violet-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">No Server Connected</h2>
          <p className="text-slate-400 max-w-md mt-2 mb-8 text-sm leading-relaxed">
            You must connect your Discord server and configure the mirroring channel in your settings to view commands and dashboard telemetry.
          </p>
          <Link
            href="/dashboard/settings"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 active:scale-[0.98] transition duration-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Connect Discord Server</span>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate dynamic metrics
  const metricsData = fetchDashboardMetrics(logs);
  const priorityDist = getPriorityDistribution(logs);
  const highPriorityOpen = logs.filter(
    (log) => log.command_name === 'report' && log.incident_status === 'open' && log.priority === 'High'
  ).length;

  const metricCards = [
    {
      id: 'commands',
      label: 'Commands Today',
      value: String(metricsData.commandsToday),
      delta: 'Active today',
      trend: 'neutral' as const,
      icon: Terminal,
      accent: '#8b5cf6',
      spark: metricsData.sparks.commands,
    },
    {
      id: 'open-incidents',
      label: 'Open Incidents',
      value: String(metricsData.openIncidents),
      delta: 'Active reports',
      trend: metricsData.openIncidents > 0 ? ('down' as const) : ('neutral' as const),
      icon: AlertTriangle,
      accent: '#f87171',
      spark: metricsData.sparks.open,
    },
    {
      id: 'mirror-health',
      label: 'Slack Mirror Success',
      value: metricsData.mirrorSuccessRate,
      delta: 'Webhook deliveries',
      trend: 'neutral' as const,
      icon: CheckCircle2,
      accent: '#34d399',
      spark: metricsData.sparks.mirror,
    },
    {
      id: 'ai-classified',
      label: 'AI Triaged Reports',
      value: String(metricsData.aiClassified),
      delta: 'Gemini classified',
      trend: 'neutral' as const,
      icon: BrainCircuit,
      accent: '#22d3ee',
      spark: metricsData.sparks.ai,
    },
  ];

  // Map raw logs to ActivityFeed structure
  const mappedCommands = logs.slice(0, 7).map((log) => {
    let status: 'DELIVERED' | 'RETRYING' | 'ABANDONED' | 'SKIPPED' = 'SKIPPED';
    if (log.mirror_status === 'delivered') status = 'DELIVERED';
    else if (log.mirror_status === 'failed' || log.mirror_status === 'pending') status = 'RETRYING';
    else if (log.mirror_status === 'abandoned') status = 'ABANDONED';

    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (log.priority === 'High') priority = 'HIGH';
    else if (log.priority === 'Medium') priority = 'MEDIUM';

    const timeStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    return {
      id: log.id,
      command: `/${log.command_name}`,
      description: log.input_text || '',
      time: timeStr,
      user: `@user_${log.user_id.slice(-4)}`,
      priority,
      category: log.category ? log.category.toUpperCase() : 'OTHER',
      status,
    };
  });

  const activeServer = servers[0];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Section */}
      <Hero
        userEmail={userEmail}
        commandsToday={metricsData.commandsToday}
        successRate={metricsData.successRate}
        openIncidents={metricsData.openIncidents}
      />

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((card, index) => (
          <MetricCard key={card.id} metric={card} index={index} />
        ))}
      </div>

      {/* Timeline and Panel Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityFeed commands={mappedCommands} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <AiInsights
            priorityDistribution={priorityDist}
            openIncidents={metricsData.openIncidents}
            highCount={highPriorityOpen}
          />
          <HealthPanel hasSlackWebhook={!!activeServer?.mirror_webhook_url} />
        </div>
      </div>
    </div>
  );
}
