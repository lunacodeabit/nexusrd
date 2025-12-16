// Script to run SQL migrations on Supabase
// Run with: npx tsx scripts/run-migration.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lldhpidjcjyjldhpbjql.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required');
  console.log('\nTo get the service key:');
  console.log('1. Go to https://supabase.com/dashboard/project/lldhpidjcjyjldhpbjql/settings/api');
  console.log('2. Copy the "service_role" key (NOT the anon key)');
  console.log('3. Run: $env:SUPABASE_SERVICE_KEY="your-key"; npx tsx scripts/run-migration.ts');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('🚀 Running SuperAdmin migration...\n');

  // Since we can't run raw SQL with the JS client, we'll create the tables
  // using the REST API. The user needs to run the SQL manually in Supabase Dashboard.
  
  console.log('⚠️  The Supabase JS client cannot run raw SQL.');
  console.log('📋 Please run the SQL manually:\n');
  console.log('1. Go to: https://supabase.com/dashboard/project/lldhpidjcjyjldhpbjql/sql');
  console.log('2. Copy the contents of: supabase/migrations/001_superadmin_tables.sql');
  console.log('3. Paste and click "Run"\n');
  
  // However, we CAN check if tables exist and insert data
  console.log('Checking current state...\n');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
    
  if (profilesError) {
    console.log('❌ user_profiles table does not exist yet');
    console.log('   Run the SQL migration first!\n');
  } else {
    console.log('✅ user_profiles table exists');
    
    // Try to set admin role for howard@alveare.do
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('email', 'howard@alveare.do')
      .select();
      
    if (error) {
      console.log('⚠️  Could not update role:', error.message);
    } else if (data && data.length > 0) {
      console.log('✅ howard@alveare.do is now ADMIN');
    } else {
      console.log('⚠️  User howard@alveare.do not found in user_profiles');
    }
  }
}

runMigration().catch(console.error);
