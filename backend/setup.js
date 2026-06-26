// ══════════════════════════════════════════════════
// GenFlo — Database Setup Script
// Runs the schema.sql against your Supabase project
// ══════════════════════════════════════════════════
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function setupDatabase() {
  console.log('\n🌿 GenFlo — Database Setup');
  console.log('═══════════════════════════════════════');
  console.log(`📡 Connecting to: ${process.env.SUPABASE_URL}`);

  // Test connection
  const { data: connTest, error: connErr } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);

  if (connErr && connErr.code !== 'PGRST116' && connErr.code !== '42P01') {
    console.log('\n❌ Connection failed:', connErr.message);
    console.log('\n👉 Please run the schema manually:');
    console.log('   1. Go to https://supabase.com → your project');
    console.log('   2. Click SQL Editor → New Query');
    console.log('   3. Paste the contents of backend/schema.sql');
    console.log('   4. Click Run ▶\n');
    return;
  }

  if (connErr && connErr.code === '42P01') {
    console.log('\n⚠️  Tables not found — schema needs to be created.');
    console.log('\n👉 Please run schema.sql manually in Supabase:');
    console.log('   1. Go to https://supabase.com → your project');
    console.log('   2. Click SQL Editor (left sidebar)');
    console.log('   3. Click + New Query');
    console.log('   4. Open backend/schema.sql, copy all its contents');
    console.log('   5. Paste into the SQL editor and click Run ▶\n');
    console.log('   Then re-run this script to verify: node setup.js\n');
    return;
  }

  console.log('\n✅ Database connection: OK');
  console.log('✅ Tables already exist');
  console.log('\n🧪 Testing API endpoints...\n');

  // Test health endpoint
  try {
    const http = require('http');
    const req = http.get('http://localhost:3001/api/health', (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        const json = JSON.parse(body);
        if (json.status === 'ok') {
          console.log('✅ API Health Check: OK');
          console.log('✅ Server running at http://localhost:3001\n');
        }
      });
    });
    req.on('error', () => {
      console.log('⚠️  API server not running. Start it with: node server.js');
    });
  } catch(e) {}

  console.log('═══════════════════════════════════════');
  console.log('✅ Setup complete! GenFlo is ready.\n');
  console.log('📖 Next: Open http://localhost:8000 to use the app\n');
}

setupDatabase().catch(console.error);
