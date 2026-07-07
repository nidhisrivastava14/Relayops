-- Create servers table
CREATE TABLE IF NOT EXISTS servers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guild_id TEXT UNIQUE NOT NULL,
    channel_id TEXT NOT NULL,
    mirror_webhook_url TEXT,
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create command_configs table
CREATE TABLE IF NOT EXISTS command_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    server_id UUID REFERENCES servers(id) ON DELETE CASCADE,
    command_name TEXT NOT NULL,
    rule_behavior JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create command_logs table
CREATE TABLE IF NOT EXISTS command_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id TEXT UNIQUE NOT NULL,
    server_id UUID REFERENCES servers(id) ON DELETE SET NULL,
    guild_id TEXT,
    command_name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    input_text TEXT,
    status TEXT NOT NULL,                  -- 'received' | 'completed' | 'failed'
    action_taken TEXT,                    -- 'created_report' | 'status_lookup'
    incident_status TEXT,                 -- 'open' | 'resolved' (nullable)
    mirror_status TEXT,                   -- 'pending' | 'delivered' | 'failed' (nullable)
    category TEXT,                        -- AI Triaged Category (nullable)
    priority TEXT,                        -- AI Triaged Priority (nullable)
    ai_summary TEXT,                      -- AI Triaged Summary (nullable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_logs ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist to avoid errors
DROP POLICY IF EXISTS server_owner_policy ON servers;
DROP POLICY IF EXISTS command_configs_owner_policy ON command_configs;
DROP POLICY IF EXISTS command_logs_owner_policy ON command_logs;

-- Create RLS Policies
CREATE POLICY server_owner_policy ON servers
    FOR ALL
    USING (auth.uid() = admin_user_id);

CREATE POLICY command_configs_owner_policy ON command_configs
    FOR ALL
    USING (
        server_id IN (
            SELECT id FROM servers WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY command_logs_owner_policy ON command_logs
    FOR SELECT
    USING (
        server_id IN (
            SELECT id FROM servers WHERE admin_user_id = auth.uid()
        )
        OR
        guild_id IN (
            SELECT guild_id FROM servers WHERE admin_user_id = auth.uid()
        )
    );
