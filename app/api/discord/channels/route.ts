import { NextResponse } from 'next/server';
import { createServerClientInstance } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface DiscordChannel {
  id: string;
  name: string;
  type: number;
}

export async function GET(request: Request) {
  // 1. Verify user session to secure access
  const supabase = createServerClientInstance();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized user session.' }, { status: 401 });
  }

  // 2. Parse query parameters
  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get('guild_id');

  if (!guildId) {
    return NextResponse.json({ error: 'Missing guild_id parameter.' }, { status: 400 });
  }

  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'DISCORD_BOT_TOKEN is not configured.' }, { status: 500 });
  }

  try {
    // 3. Fetch server details to get the guild name
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    let guildName = 'Connected Discord Server';
    if (guildRes.ok) {
      const guildData = await guildRes.json();
      guildName = guildData.name || 'Connected Discord Server';
    }

    // 4. Fetch channels list
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error(`[Discord API] Fetch channels failed with status ${res.status}: ${errBody}`);
      return NextResponse.json(
        { error: `Discord API returned status ${res.status}` },
        { status: res.status }
      );
    }

    const channels = await res.json() as DiscordChannel[];

    // Filter text channels (GUILD_TEXT type is 0)
    const textChannels = Array.isArray(channels)
      ? channels
          .filter((channel) => channel.type === 0)
          .map((channel) => ({
            id: channel.id,
            name: channel.name,
          }))
      : [];

    return NextResponse.json({
      guildName,
      channels: textChannels,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[Discord API] Unexpected error fetching channels:', err);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
