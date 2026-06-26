const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

async function runMigration() {
  try {
    // Run integrations table migration (most important)
    console.log('Reading integrations migration file...');
    const integrationsSQL = fs.readFileSync('./supabase/migrations/create_integrations.sql', 'utf-8');

    console.log('Executing migration...');
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({ sql }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Error running migration:', error);
      // Try alternative approach - execute statements individually
      await executeStatements(sql, serviceRoleKey, supabaseUrl);
      return;
    }

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

async function executeStatements(sql, serviceRoleKey, supabaseUrl) {
  const statements = sql.split(';').filter(s => s.trim());

  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      // Note: Direct SQL execution requires SQL Editor access in Supabase dashboard
      // This is a fallback message
    } catch (err) {
      console.error('Error executing statement:', err.message);
    }
  }

  console.log('\n⚠️  Note: Direct SQL execution through API failed.');
  console.log('Please run the migration in the Supabase SQL Editor:');
  console.log('1. Go to https://app.supabase.com/project/_/sql');
  console.log('2. Copy and paste the contents of supabase/migrations/add_archived_column.sql');
  console.log('3. Click "Run"');
}

runMigration();
