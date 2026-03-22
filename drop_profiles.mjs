import pg from 'pg';

const connectionString = `postgresql://postgres.beerjjafpgeqjyybmdbd:Lonake300%40%40@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`;
const pool = new pg.Pool({ connectionString });

async function main() {
  try {
    await pool.query('DROP TABLE IF EXISTS public.profiles CASCADE;');
    console.log('✅ Dropped public.profiles successfully.');
  } catch (err) {
    console.error('❌ Failed to drop table:', err);
  } finally {
    await pool.end();
  }
}
main();
