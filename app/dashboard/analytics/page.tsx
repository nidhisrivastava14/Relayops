'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createBrowserClientInstance } from '@/lib/supabase/browser';
import { MirrorStatus } from '@/lib/types';
import { CommandVolumeChart } from '@/components/analytics/command-volume-chart';
import { CommandsByCategory } from '@/components/analytics/commands-by-category';
import { HourlyActivity } from '@/components/analytics/hourly-activity';
import { SuccessFailureChart } from '@/components/analytics/success-failure-chart';
import { TopCommands } from '@/components/analytics/top-commands';
import { ProcessingTime } from '@/components/analytics/processing-time';
import {
  fetchDashboardMetrics,
  getCommandVolume,
  getCommandsByCategory,
  getSuccessFailure,
  getHourlyActivity,
  getTopCommands,
} from '@/lib/data-queries';

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

export default function AnalyticsPage() {
  const supabase = createBrowserClientInstance();
  const [servers, setServers] = useState<ServerRow[]>([]);
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

        const { data: logsData, error: logsErr } = await supabase
          .from('command_logs')
          .select('*')
          .in('guild_id', guildIds)
          .order('created_at', { ascending: false });

        if (logsErr) {
          console.error('Error fetching logs:', logsErr);
        } else {
          setLogs(logsData || []);
        }
      }
    } catch (err) {
      console.error('Failed to load analytics data:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);



  // Calculate dynamic metrics
  const metrics = useMemo(() => fetchDashboardMetrics(logs), [logs]);
  const totalMirrors = useMemo(() => logs.filter((l) => l.mirror_status === 'delivered').length, [logs]);
  
  // Calculate dynamic chart data
  const commandVol = useMemo(() => getCommandVolume(logs), [logs]);
  const categories = useMemo(() => getCommandsByCategory(logs), [logs]);
  const successFail = useMemo(() => getSuccessFailure(logs), [logs]);
  const hourly = useMemo(() => getHourlyActivity(logs), [logs]);
  const topCmds = useMemo(() => getTopCommands(logs), [logs]);

  if (loading) {
    return (
      <div className="main flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <svg className="animate-spin h-8 w-8 text-violet-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading analytics...</span>
      </div>
    );
  }

  if (servers.length === 0) {
    return (
      <div className="main flex flex-col items-center justify-center mt-12">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl p-8 text-center flex flex-col items-center justify-center shadow-xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">No Server Connected</h2>
          <p className="text-slate-400 max-w-md mt-2 mb-8 text-sm leading-relaxed">
            Please connect your Discord server in your settings to view command analytics.
          </p>
        </div>
      </div>
    );
  }



  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="page-title">Analytics & reporting</div>
          <div className="page-subtitle">Analyze command usage, routing efficiency, and AI accuracy.</div>
        </div>
        <div className="header-actions">

          <div className="btn btn-ghost">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Last 7 days
          </div>
          <div className="btn btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
            Export
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Interactions today</div>
          <div className="metric-value">{metrics.commandsToday}</div>
          <div className="metric-note">Total registered commands today</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Overall success rate</div>
          <div className="metric-value accent">{metrics.successRate}</div>
          <div className="metric-note">Rate of successful executions</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Mirrors mirrored</div>
          <div className="metric-value">{totalMirrors}</div>
          <div className="metric-note">Delivered Slack notifications</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Connected guilds</div>
          <div className="metric-value accent">{servers.length}</div>
          <div className="metric-note">Active guild configuration entries</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-title">Command volume over time</div>
          <div style={{ height: '220px', marginTop: '10px' }}>
            <CommandVolumeChart data={commandVol} />
          </div>
        </div>
        <div className="chart-card">
          <div className="chart-title">Commands by category</div>
          <div style={{ height: '220px', marginTop: '10px' }}>
            <CommandsByCategory data={categories} />
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginBottom: '20px' }}>
        <div className="chart-title">Success vs failure rate</div>
        <div style={{ height: '220px', marginTop: '10px' }}>
          <SuccessFailureChart data={successFail} />
        </div>
      </div>

      <div className="calendar-card">
        <div className="chart-title">Hourly activity calendar</div>
        <div style={{ marginTop: '10px' }}>
          <HourlyActivity data={hourly} />
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel-card">
          <div className="chart-title">Top commands</div>
          <div style={{ marginTop: '10px' }}>
            <TopCommands data={topCmds} />
          </div>
        </div>
        <div className="panel-card">
          <ProcessingTime />
        </div>
      </div>
    </div>
  );
}
