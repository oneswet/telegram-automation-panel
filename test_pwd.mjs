import pg from 'pg';
const { Pool } = pg;

async function testPassword() {
  const pool = new Pool({
    host: 'aws-1-eu-west-1.pooler.supabase.com',
    port: 5432,
    database: 'postgres',
    user: 'postgres.beerjjafpgeqjyybmdbd',
    password: 'Lonake300@@@',
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const res = await pool.query('SELECT 1 as result');
    console.log('✅ Connection successful! Result:', res.rows[0].result);
    process.exit(0);
  } catch (err) {
    console.log('❌ Connection failed:', err.message);
  } finally {
    await pool.end().catch(()=> {});
  }
}

testPassword();
