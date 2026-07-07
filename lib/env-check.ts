export function validateEnv() {
  if (process.env.NODE_ENV !== 'development') return;

  const required = [
    'DISCORD_PUBLIC_KEY',
    'DISCORD_BOT_TOKEN',
    'DISCORD_APPLICATION_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GEMINI_API_KEY',
    'CRON_SECRET'
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please check your .env.local file.`);
  }
}
