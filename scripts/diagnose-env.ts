import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve(process.cwd(), '.env.local');
const envVars: Record<string, string> = {};

console.log('===================================================');
console.log('SUPABASE ENVIRONMENT DIAGNOSTIC UTILITY');
console.log('===================================================');

if (!fs.existsSync(envPath)) {
  console.error(`❌ ERROR: Could not find .env.local file at: ${envPath}`);
  console.log('Please create a file named .env.local in your project root.');
  process.exit(1);
}

// Simple env file parser
const content = fs.readFileSync(envPath, 'utf8');
content.split('\n').forEach((line) => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    if (key) {
      const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      envVars[key] = val;
    }
  }
});

const url = envVars.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

let hasErrors = false;

// 1. Validate NEXT_PUBLIC_SUPABASE_URL
console.log('\nChecking NEXT_PUBLIC_SUPABASE_URL...');
if (!url) {
  console.log('❌ FAILED: NEXT_PUBLIC_SUPABASE_URL is missing.');
  hasErrors = true;
} else {
  console.log(`Value: "${url.substring(0, 15)}...${url.substring(url.length - 5)}"`);
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    console.log('❌ FAILED: You are using a PostgreSQL database connection string (starts with postgresql://).');
    console.log('   👉 FIX: Use the HTTP API URL from your Settings -> API page. It must start with https://');
    hasErrors = true;
  } else if (!url.startsWith('https://') && !url.startsWith('http://')) {
    console.log('❌ FAILED: URL must start with https://');
    hasErrors = true;
  } else if (url.endsWith('/')) {
    console.log('❌ FAILED: URL ends with a trailing slash (/).');
    console.log('   👉 FIX: Remove the "/" at the end of your URL.');
    hasErrors = true;
  } else if (url.endsWith('/v1') || url.endsWith('/rest/v1')) {
    console.log('❌ FAILED: URL contains path endings like /v1 or /rest/v1.');
    console.log('   👉 FIX: Remove the path segments. The URL should only contain the base domain.');
    hasErrors = true;
  } else {
    console.log('✅ URL format looks correct.');
  }
}

// 2. Validate NEXT_PUBLIC_SUPABASE_ANON_KEY
console.log('\nChecking NEXT_PUBLIC_SUPABASE_ANON_KEY...');
if (!anonKey) {
  console.log('❌ FAILED: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.');
  hasErrors = true;
} else {
  console.log(`Length: ${anonKey.length} characters`);
  const parts = anonKey.split('.');
  if (parts.length !== 3) {
    console.log('❌ FAILED: Key is not in JWT format (needs to have 3 dot-separated segments).');
    console.log('   👉 FIX: Ensure you are copying the "anon" public key, not a password or db string.');
    hasErrors = true;
  } else {
    console.log('✅ Key format looks correct (JWT).');
  }
}

// 3. Validate SUPABASE_SERVICE_ROLE_KEY
console.log('\nChecking SUPABASE_SERVICE_ROLE_KEY...');
if (!serviceKey) {
  console.log('⚠️ WARNING: SUPABASE_SERVICE_ROLE_KEY is missing.');
  console.log('   (Note: Server-side webhook routing and cron retries will fail without this).');
} else {
  console.log(`Length: ${serviceKey.length} characters`);
  const parts = serviceKey.split('.');
  if (parts.length !== 3) {
    console.log('❌ FAILED: Service role key is not in JWT format.');
    hasErrors = true;
  } else {
    console.log('✅ Key format looks correct (JWT).');
  }
}

if (hasErrors) {
  console.log('\n===================================================');
  console.log('❌ DIAGNOSIS: Please fix the errors above and restart your server.');
  console.log('===================================================');
  process.exit(1);
}

// 4. Try client instantiation
console.log('\nInitializing Supabase Client test...');
try {
  const client = createClient(url, anonKey);
  console.log('✅ Supabase client instantiated successfully.');

  console.log('\nTesting connection to Supabase API...');
  client.auth.getUser()
    .then(({ error }) => {
      if (error && error.message.includes('API key')) {
        console.log('❌ FAILED: API connection rejected by Supabase (Invalid API Key).');
        console.log('   👉 FIX: Double check that you did not accidentally paste your "service_role" key into the "anon" key input or vice-versa.');
      } else if (error) {
        console.log(`⚠️ Connection test completed with Auth error: ${error.message} (This is normal if no session exists).`);
        console.log('✅ Supabase connection was accepted! Your env parameters are correct.');
      } else {
        console.log('✅ Supabase connection accepted successfully!');
      }
    })
    .catch((err) => {
      console.error('❌ Connection error:', err.message);
    });
} catch (err: any) {
  console.error('❌ FAILED to construct Supabase client:', err.message);
}
