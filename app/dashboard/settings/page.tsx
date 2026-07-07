'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClientInstance } from '@/lib/supabase/browser';

function SettingsContent() {
  const supabase = createBrowserClientInstance();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Settings State
  const [guildId, setGuildId] = useState('');
  const [guildName, setGuildName] = useState('');
  const [channelId, setChannelId] = useState('');
  const [slackWebhook, setSlackWebhook] = useState('');

  // Dropdown Text Channels list
  const [channels, setChannels] = useState<{ id: string; name: string }[]>([]);
  const [authUrl, setAuthUrl] = useState('');

  // UI status states
  const [loading, setLoading] = useState(true);
  const [fetchingChannels, setFetchingChannels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load available channels for a connected Guild
  const loadChannels = useCallback(async (id: string) => {
    if (!id) return;
    setFetchingChannels(true);
    try {
      const res = await fetch(`/api/discord/channels?guild_id=${id}`);
      if (res.ok) {
        const data = await res.json();
        setGuildName(data.guildName || 'Connected Discord Server');
        setChannels(data.channels || []);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to retrieve server text channels.');
        setGuildName('');
        setChannels([]);
      }
    } catch (err) {
      console.error('[Settings] Error fetching channels:', err);
      setErrorMsg('Unexpected error fetching channels.');
    } finally {
      setFetchingChannels(false);
    }
  }, []);

  // Fetch settings from DB
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('servers')
        .select('*')
        .eq('admin_user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching settings:', error);
        setErrorMsg('Failed to load existing server settings.');
      } else if (data) {
        setGuildId(data.guild_id);
        setChannelId(data.channel_id);
        setSlackWebhook(data.mirror_webhook_url || '');
        // Load text channels for the loaded server
        await loadChannels(data.guild_id);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred while loading settings.');
    } finally {
      setLoading(false);
    }
  }, [supabase, loadChannels]);

  // Load the Discord invitation URL
  const fetchAuthUrl = useCallback(async () => {
    try {
      const res = await fetch('/api/discord/auth-url');
      if (res.ok) {
        const data = await res.json();
        setAuthUrl(data.url);
      }
    } catch (err) {
      console.error('[Settings] Error loading auth url:', err);
    }
  }, []);

  // On mount and callback changes
  useEffect(() => {
    fetchSettings();
    fetchAuthUrl();
  }, [fetchSettings, fetchAuthUrl]);

  // Detect OAuth redirect query parameters (callback returned from Discord)
  useEffect(() => {
    const oauthGuildId = searchParams.get('guild_id');
    if (oauthGuildId) {
      setGuildId(oauthGuildId);
      loadChannels(oauthGuildId);

      // Clean the URL query parameters so they don't persist on page refreshes
      const cleanUrl = window.location.pathname;
      router.replace(cleanUrl);
    }
  }, [searchParams, loadChannels, router]);

  const handleDisconnect = () => {
    setGuildId('');
    setGuildName('');
    setChannelId('');
    setChannels([]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSuccess(false);

    if (!guildId.trim()) {
      setErrorMsg('Please connect your Discord Server first.');
      setSaving(false);
      return;
    }
    if (!channelId.trim()) {
      setErrorMsg('Please select a target Discord logging channel.');
      setSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setErrorMsg('User session not found. Please log in again.');
        setSaving(false);
        return;
      }

      // Upsert server config
      const { error } = await supabase.from('servers').upsert(
        {
          guild_id: guildId.trim(),
          channel_id: channelId.trim(),
          mirror_webhook_url: slackWebhook.trim() || null,
          admin_user_id: user.id,
        },
        {
          onConflict: 'guild_id',
        }
      );

      if (error) {
        console.error('Error saving settings:', error);
        setErrorMsg(error.message || 'Failed to save server settings.');
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('An unexpected error occurred while saving.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <svg className="animate-spin h-8 w-8 text-violet-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading server settings...</span>
      </div>
    );
  }

  return (
    <div className="main max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="page-header border-b border-[color:var(--divider)] pb-6">
        <div>
          <div className="page-title">Server Settings</div>
          <div className="page-subtitle">
            Connect your Discord Server and configure text channels for automated incident mirrors.
          </div>
        </div>
      </div>

      <div className="panel-card p-8">
        <form onSubmit={handleSave} className="space-y-6" autoComplete="off">
          {success && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[color:var(--success)] text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Server settings updated successfully.</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[color:var(--danger)] text-sm flex items-center gap-2">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Connection Status Section */}
          <div className="p-5 rounded-xl border border-[color:var(--card-border)] bg-[color:var(--field-bg)] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-semibold text-[color:var(--text-muted)] block">Integration Status</span>
                {guildId ? (
                  <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected to Server
                  </span>
                ) : (
                  <span className="text-sm font-bold text-[color:var(--text-muted)] flex items-center gap-1.5 mt-1">
                    <span className="h-2 w-2 rounded-full bg-[color:var(--text-muted)]" />
                    Not Connected
                  </span>
                )}
              </div>
              {guildId && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg border border-[color:var(--card-border)] text-xs font-semibold text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--hover-bg)] transition"
                >
                  Disconnect Server
                </button>
              )}
            </div>

            {guildId ? (
              <div className="pt-2 border-t border-[color:var(--divider)] grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[color:var(--text-muted)] block">Server Name</span>
                  <span className="text-sm font-semibold text-[color:var(--text-primary)] mt-1 block">
                    {fetchingChannels ? 'Retrieving details...' : guildName}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-[color:var(--text-muted)] block">Guild ID</span>
                  <span className="text-sm font-mono text-[color:var(--text-secondary)] mt-1 block">{guildId}</span>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex flex-col items-center justify-center py-6 text-center">
                <p className="text-xs text-[color:var(--text-secondary)] max-w-sm mb-4">
                  Authorize the bot on your Discord Server to automatically read channels and telemetry.
                </p>
                <a
                  href={authUrl || '#'}
                  className={`px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/10 active:scale-[0.98] transition duration-150 ${
                    !authUrl && 'opacity-50 pointer-events-none'
                  }`}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z"/>
                  </svg>
                  Connect Discord Server
                </a>
              </div>
            )}
          </div>

          {guildId && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-2">
                  Target Discord Channel
                </label>
                <div className="relative">
                  {fetchingChannels ? (
                    <div className="w-full px-4 py-3 rounded-xl bg-[color:var(--field-bg)] border border-[color:var(--card-border)] text-[color:var(--text-muted)] text-sm flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Fetching server channels list...</span>
                    </div>
                  ) : (
                    <select
                      value={channelId}
                      onChange={(e) => setChannelId(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-[color:var(--field-bg)] border border-[color:var(--card-border)] text-[color:var(--text-primary)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 appearance-none cursor-pointer"
                    >
                      <option value="" disabled className="bg-[color:var(--page-bg)]">Select a Discord Text Channel...</option>
                      {channels.map((chan) => (
                        <option key={chan.id} value={chan.id} className="bg-[color:var(--page-bg)] text-[color:var(--text-primary)]">
                          #{chan.name}
                        </option>
                      ))}
                      {channelId && !channels.some((c) => c.id === channelId) && (
                        <option value={channelId} className="bg-[color:var(--page-bg)] text-[color:var(--text-primary)]">
                          Configured Channel (ID: {channelId})
                        </option>
                      )}
                    </select>
                  )}
                  {!fetchingChannels && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-[color:var(--text-muted)]">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                      </svg>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-[color:var(--text-muted)] mt-1 block">
                  Select the channel where the bot logs commands and incidents.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[color:var(--text-secondary)] uppercase tracking-wider mb-2">
                  Slack Webhook URL (Optional)
                </label>
                <input
                  type="password"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl bg-[color:var(--field-bg)] border border-[color:var(--card-border)] text-[color:var(--text-primary)] placeholder-[color:var(--text-muted)] focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition duration-200 font-mono text-sm"
                  placeholder={slackWebhook ? "••••••••••••••••••••••••" : "https://hooks.slack.com/services/..."}
                />
                <span className="text-[10px] text-[color:var(--text-muted)] mt-1 block">
                  Slack Incoming Webhook URL. Saved securely, never exposed in client API responses.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[color:var(--divider)]">
            <button
              type="submit"
              disabled={saving || !guildId}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition duration-200 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving Configuration...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-slate-400">
        <svg className="animate-spin h-8 w-8 text-violet-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading settings screen...</span>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
