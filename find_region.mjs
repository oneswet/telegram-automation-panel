import pg from 'pg';
const { Pool } = pg;

const regions = [
  'us-east-1',
  'us-west-1',
  'us-west-2',
  'eu-central-1',
  'eu-west-1',
  'eu-west-2',
  'eu-west-3',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'ap-south-1',
  'sa-east-1',
  'ca-central-1'
];

async function testRegion(region) {
  const connectionString = `postgresql://postgres.beerjjafpgeqjyybmdbd:Lonake300%40%40%40@aws-0-${region}.pooler.supabase.com:5432/postgres`;
  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 });
  
  try {
    await pool.query('SELECT 1');
    return { region, success: true };
  } catch (err) {
    return { region, success: false, error: err.message };
  } finally {
    await pool.end().catch(()=> {});
  }
}

async function main() {
  console.log('Testing regions...');
  for (const region of regions) {
    console.log(`Testing aws-0-${region}...`);
    const result = await testRegion(region);
    if (result.success) {
      console.log(`\n✅ FOUND IT! The correct region is: aws-0-${region}`);
      process.exit(0);
    } else if (!result.error.includes('Tenant or user not found') && !result.error.includes('getaddrinfo ENOTFOUND')) {
      console.log(`\n⚠️ WRONG PASSWORD BUT TENANT FOUND at: aws-0-${region} (Error: ${result.error})`);
      process.exit(0);
    }
  }
  console.log('\n❌ None of the common regions worked. The project might be paused.');
}

main();
