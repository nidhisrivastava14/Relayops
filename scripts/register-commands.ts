import fs from 'fs';
import path from 'path';

// Parse .env manually to ensure environment variables are loaded
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    for (const line of envConfig.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const index = trimmed.indexOf('=');
      if (index !== -1) {
        const key = trimmed.slice(0, index).trim();
        let value = trimmed.slice(index + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }
  }
} catch (e) {
  console.warn('Could not parse .env file:', e);
}

const botToken = process.env.DISCORD_BOT_TOKEN;
const applicationId = process.env.DISCORD_APPLICATION_ID;

if (!botToken || !applicationId) {
  console.error('Error: DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID must be set in environment variables or .env file');
  process.exit(1);
}

const commands = [
  {
    name: 'report',
    description: 'Report a new incident',
    options: [
      {
        name: 'text',
        description: 'Details of the incident to report',
        type: 3, // STRING (Type 3 represents STRING in Discord API)
        required: true,
      },
    ],
  },
  {
    name: 'status',
    description: 'Check the count of open incidents',
  },
];

async function register() {
  const url = `https://discord.com/api/v10/applications/${applicationId}/commands`;
  console.log(`Registering slash commands globally...`);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commands),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Discord REST API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    console.log('Commands successfully registered:', data);
  } catch (error) {
    console.error('Registration failed:', error);
    process.exit(1);
  }
}

register();
