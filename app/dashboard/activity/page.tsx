'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createBrowserClientInstance } from '@/lib/supabase/browser';
import { MirrorStatus } from '@/lib/types';

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
  retry_count: number;
  category: string | null;
  priority: string | null;
  ai_summary: string | null;
  created_at: string;
}

export default function ActivityLogPage() {
  const supabase = createBrowserClientInstance();
  const [logs, setLogs] = useState<CommandLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [guildIds, setGuildIds] = useState<string[]>([]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [incidentFilter, setIncidentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  const loadLogs = useCallback(async (ids: string[], currentPage: number) => {
    setLoading(true);
    try {
      let query = supabase
        .from('command_logs')
        .select('*', { count: 'exact' })
        .in('guild_id', ids)
        .order('created_at', { ascending: false });

      // Apply Search
      if (searchQuery) {
        query = query.or(`input_text.ilike.%${searchQuery}%,user_id.ilike.%${searchQuery}%`);
      }

      // Apply Filters
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (incidentFilter !== 'all') {
        query = query.eq('incident_status', incidentFilter);
      }

      // Apply Date Filter
      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', yesterday.toISOString()).lt('created_at', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      }

      // Apply pagination range
      const from = (currentPage - 1) * pageSize;
      const to = currentPage * pageSize - 1;

      const { data, count, error } = await query.range(from, to);

      if (error) {
        console.error('Error fetching logs range:', error);
      } else {
        setLogs((data as CommandLog[]) || []);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Failed to load logs query:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, searchQuery, statusFilter, incidentFilter, dateFilter]);

  const fetchServersAndLogs = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: serversData } = await supabase
        .from('servers')
        .select('guild_id')
        .eq('admin_user_id', user.id);

      const ids = serversData?.map((s) => s.guild_id) || [];
      setGuildIds(ids);

      if (ids.length > 0) {
        await loadLogs(ids, page);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching servers/logs:', err);
      setLoading(false);
    }
  }, [supabase, page, loadLogs]);

  useEffect(() => {
    fetchServersAndLogs();
  }, [fetchServersAndLogs]);

  useEffect(() => {
    if (guildIds.length > 0) {
      setPage(1);
      loadLogs(guildIds, 1);
    }
  }, [searchQuery, statusFilter, incidentFilter, dateFilter, guildIds, loadLogs]);

  useEffect(() => {
    if (guildIds.length > 0 && page > 1) {
      loadLogs(guildIds, page);
    }
  }, [page, guildIds, loadLogs]);



  const getStatusBadge = (status: CommandLog['status']) => {
    const color = status === 'completed' ? 'var(--success)' : status === 'failed' ? 'var(--failure)' : 'var(--text-tertiary)';
    return <span style={{ color, fontWeight: 500 }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const getIncidentBadge = (status: CommandLog['incident_status']) => {
    if (!status) return <span>-</span>;
    const color = status === 'open' ? '#f2b45c' : 'var(--success)';
    return <span style={{ color, fontWeight: 500 }}>{status === 'open' ? 'Open' : 'Resolved'}</span>;
  };

  const getMirrorBadge = (status: CommandLog['mirror_status']) => {
    if (!status) return <span>Skipped</span>;
    let label = 'Pending';
    let color = 'var(--text-tertiary)';
    if (status === 'delivered') { label = 'Delivered'; color = 'var(--success)'; }
    if (status === 'failed') { label = 'Retrying'; color = '#f2b45c'; }
    return <span style={{ color, fontWeight: 500 }}>{label}</span>;
  };

  const getPriorityBadge = (priority: CommandLog['priority']) => {
    if (!priority) return <span>-</span>;
    let color = 'var(--text-tertiary)';
    if (priority === 'High') color = 'var(--failure)';
    if (priority === 'Medium') color = '#f2b45c';
    if (priority === 'Low') color = 'var(--accent-1)';
    return <span style={{ color, fontWeight: 500 }}>{priority}</span>;
  };
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="page-title">Command activity logs</div>
          <div className="page-subtitle">Inspect, search, and audit Discord interactions and Slack mirrors.</div>
        </div>

      </div>

      <div className="filter-card">
        <div className="filter-top">
          <div className="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.3-4.3"/>
            </svg>
            <input
              type="text"
              placeholder="Search by user ID or input payload text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="select-field">
            <span><span className="label">Execution:</span></span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="select-field">
            <span><span className="label">Incident:</span></span>
            <select value={incidentFilter} onChange={(e) => setIncidentFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        <div className="filter-bottom">
          <div className="select-field">
            <span><span className="label">Timeframe:</span></span>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Past 7 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <span>Timestamp</span>
          <span>Command</span>
          <span>User ID</span>
          <span>Payload</span>
          <span>Incident</span>
          <span>Priority</span>
          <span>Execution</span>
          <span>Slack mirror</span>
        </div>
        
        {loading ? (
          <div className="table-empty">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="table-empty">No activity logs match your search and filter criteria.</div>
        ) : (
          <div className="table-body">
            {logs.map(log => (
              <div key={log.id} className="table-row">
                <span style={{ color: 'var(--text-tertiary)' }}>{new Date(log.created_at).toLocaleString()}</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>/{log.command_name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{log.user_id.slice(-6)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.input_text || ''}>
                  {log.input_text || '-'}
                </span>
                {getIncidentBadge(log.incident_status)}
                {getPriorityBadge(log.priority)}
                {getStatusBadge(log.status)}
                {getMirrorBadge(log.mirror_status)}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} logs
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= totalPages}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-primary)', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
