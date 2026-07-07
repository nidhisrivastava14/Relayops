import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Simple parser for .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envVars: Record<string, string> = {};
if (fs.existsSync(envPath)) {
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
}

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const cronSecret = envVars.CRON_SECRET || process.env.CRON_SECRET;
const port = envVars.PORT || process.env.PORT || '3000';
const baseUrl = `http://localhost:${port}`;

async function runTests() {
  console.log('===================================================');
  console.log('STARTING ADVERSARIAL RUNTIME VERIFICATION TESTS');
  console.log('===================================================');

  // Test Scenario A: /interactions with missing/invalid signature header
  console.log('\n--- Scenario A: Missing / Invalid Signature Headers ---');
  try {
    const res = await fetch(`${baseUrl}/api/discord/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type: 1 }), // Ping interaction
    });
    console.log(`HTTP Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body: "${text}"`);
    if (res.status === 401) {
      console.log('Result: SUCCESS (Rejected with 401)');
    } else {
      console.log('Result: FAIL (Expected 401)');
    }
  } catch (err: any) {
    console.error('Request failed. Is the Next.js dev server running on localhost:3000?', err.message);
  }

  // Test Scenario F: GET /api/cron/retry-mirrors without secret
  console.log('\n--- Scenario F: Hit Cron Endpoint Without Secret ---');
  try {
    const res = await fetch(`${baseUrl}/api/cron/retry-mirrors`, {
      method: 'GET',
    });
    console.log(`HTTP Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response Body: "${text}"`);
    if (res.status === 401) {
      console.log('Result: SUCCESS (Rejected with 401)');
    } else {
      console.log('Result: FAIL (Expected 401)');
    }
  } catch (err: any) {
    console.error('Request failed:', err.message);
  }

  // Test Scenario F2: GET /api/cron/retry-mirrors WITH secret
  console.log('\n--- Scenario F2: Hit Cron Endpoint WITH Valid Secret ---');
  if (!cronSecret) {
    console.log('Skipping: CRON_SECRET not defined in envVars or process.env.');
  } else {
    try {
      const res = await fetch(`${baseUrl}/api/cron/retry-mirrors`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      });
      console.log(`HTTP Status: ${res.status}`);
      const data = await res.json();
      console.log('Response JSON:', data);
      if (res.status === 200) {
        console.log('Result: SUCCESS');
      } else {
        console.log('Result: FAIL');
      }
    } catch (err: any) {
      console.error('Request failed:', err.message);
    }
  }

  // Test Scenario G: Cross-Admin RLS Verification
  console.log('\n--- Scenario G: Cross-Admin RLS Verification ---');
  
  const email1 = envVars.TEST_ADMIN_1_EMAIL || process.env.TEST_ADMIN_1_EMAIL;
  const pass1 = envVars.TEST_ADMIN_1_PASSWORD || process.env.TEST_ADMIN_1_PASSWORD;
  const email2 = envVars.TEST_ADMIN_2_EMAIL || process.env.TEST_ADMIN_2_EMAIL;
  const pass2 = envVars.TEST_ADMIN_2_PASSWORD || process.env.TEST_ADMIN_2_PASSWORD;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.log('Skipping Database Tests: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY is missing.');
  } else if (!email1 || !pass1 || !email2 || !pass2) {
    console.log('Skipping RLS Test: TEST_ADMIN_1_EMAIL, TEST_ADMIN_1_PASSWORD, TEST_ADMIN_2_EMAIL, or TEST_ADMIN_2_PASSWORD are not defined.');
    console.log('Set these variables in .env.local to execute the database cross-admin isolation test.');
  } else {
    try {
      // 1. Create client A and sign in
      const supabaseA = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { data: authA, error: errA } = await supabaseA.auth.signInWithPassword({ email: email1, password: pass1 });
      if (errA) throw new Error(`Admin 1 login failed: ${errA.message}`);
      console.log(`Logged in as Admin 1: ${email1} (UID: ${authA.user?.id})`);

      // Create a test server configuration owned by Admin 1 using service role client
      const supabaseService = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } });
      const tempGuildId = `test_guild_${Date.now()}`;
      
      const { error: insertSrvErr } = await supabaseService.from('servers').insert({
        guild_id: tempGuildId,
        channel_id: '123456',
        admin_user_id: authA.user?.id,
      });
      if (insertSrvErr) throw new Error(`Failed to insert test server configuration: ${insertSrvErr.message}`);
      console.log(`Created test server configuration owned by Admin 1 (Guild: ${tempGuildId})`);

      // Insert command log associated with this guild
      const tempInteractionId = `test_interaction_${Date.now()}`;
      const { error: insertLogErr } = await supabaseService.from('command_logs').insert({
        interaction_id: tempInteractionId,
        guild_id: tempGuildId,
        command_name: 'report',
        user_id: 'discord_user_1',
        status: 'completed',
        input_text: 'Secret admin log input text',
      });
      if (insertLogErr) throw new Error(`Failed to insert command log: ${insertLogErr.message}`);
      console.log(`Logged test command interaction: ${tempInteractionId}`);

      // 2. Query log as Admin 1 (should succeed and see the row)
      const { data: logsA, error: selectErrA } = await supabaseA
        .from('command_logs')
        .select('*')
        .eq('guild_id', tempGuildId);
      
      if (selectErrA) throw new Error(`Admin 1 query failed: ${selectErrA.message}`);
      console.log(`Admin 1 queried logs. Visible rows count: ${logsA?.length || 0}`);
      if (logsA && logsA.length > 0) {
        console.log(`Admin 1 can read log content: "${logsA[0].input_text}"`);
      }

      // 3. Create client B and sign in
      const supabaseB = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
      const { data: authB, error: errB } = await supabaseB.auth.signInWithPassword({ email: email2, password: pass2 });
      if (errB) throw new Error(`Admin 2 login failed: ${errB.message}`);
      console.log(`Logged in as Admin 2: ${email2} (UID: ${authB.user?.id})`);

      // 4. Query Admin 1's log as Admin 2 (should return 0 rows due to RLS)
      const { data: logsB, error: selectErrB } = await supabaseB
        .from('command_logs')
        .select('*')
        .eq('guild_id', tempGuildId);

      if (selectErrB) throw new Error(`Admin 2 query failed: ${selectErrB.message}`);
      console.log(`Admin 2 queried logs. Visible rows count: ${logsB?.length || 0}`);
      if (!logsB || logsB.length === 0) {
        console.log('Result: SUCCESS (RLS blocked Admin 2 from viewing Admin 1\'s logs)');
      } else {
        console.log('Result: FAIL (RLS leak! Admin 2 viewed logs owned by Admin 1)');
      }

      // Cleanup test data using service role client
      await supabaseService.from('command_logs').delete().eq('interaction_id', tempInteractionId);
      await supabaseService.from('servers').delete().eq('guild_id', tempGuildId);
      console.log('Cleaned up test rows successfully.');

    } catch (err: any) {
      console.error('Error during RLS testing:', err.message);
    }
  }

  console.log('\n===================================================');
  console.log('VERIFICATION TESTS COMPLETED');
  console.log('===================================================');
}

runTests();
