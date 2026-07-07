import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const appId = process.env.DISCORD_APPLICATION_ID;
  if (!appId) {
    return NextResponse.json({ error: 'DISCORD_APPLICATION_ID is not configured.' }, { status: 500 });
  }

  // Determine host dynamically to support local tunnels and Vercel production domains
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const redirectUri = `${protocol}://${host}/dashboard/settings`;

  // Bot invite permissions: Send Messages (2048) + Manage Messages (8192) + Embed Links (16384) = 26624
  const oauthUrl = `https://discord.com/oauth2/authorize?client_id=${appId}&permissions=26624&scope=bot%20applications.commands&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

  return NextResponse.json({ url: oauthUrl });
}
