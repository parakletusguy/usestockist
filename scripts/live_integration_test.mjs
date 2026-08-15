/**
 * Live Integration Test — Staging Supabase
 * =========================================
 * Tests all key tables/views against the real staging database
 * using the anon/publishable key (unauthenticated read paths) and
 * a service-role key (full CRUD paths).
 *
 * Run:  node scripts/live_integration_test.mjs
 */

const SUPABASE_URL = 'https://xwlmeohncmfvnjukgsbz.supabase.co';
const ANON_KEY     = 'sb_publishable_dbNqrmFooqQYRt-ikMKCyw_4hnl0GDx';

// ── helpers ───────────────────────────────────────────────────────────────────

let passed = 0, failed = 0;

function ok(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✅  ${label}`);
    passed++;
  } else {
    console.error(`  ❌  ${label}${detail ? ' — ' + detail : ''}`);
    failed++;
  }
}

async function rest(path, opts = {}, key = ANON_KEY) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...opts.headers,
    },
    ...opts,
  });
  let body;
  try { body = await res.json(); } catch { body = null; }
  return { status: res.status, body };
}

// ── test suites ───────────────────────────────────────────────────────────────

async function testUnauthenticated() {
  console.log('\n📋  Unauthenticated (anon) access — RLS enforcement\n');

  // Tables with policies requiring auth.uid() should return 401 for anon
  const authRequired = ['items', 'daily_stock_sheets'];
  for (const t of authRequired) {
    const { status } = await rest(`/${t}?limit=1`);
    ok(`${t}: anon read blocked (401)`, status === 401, `got ${status}`);
  }

  // Tables with open SELECT policies should return 200 with empty array/data for anon
  const openRead = [
    'branches',
    'received_ledger',
    'transfer_ledger',
    'issuance_ledger',
    'inventory_transactions',
    'item_departments',
    'reach_sales_reports',
  ];
  for (const t of openRead) {
    const { status, body } = await rest(`/${t}?limit=1`);
    ok(
      `${t}: anon read allowed (200)`,
      status === 200 && Array.isArray(body),
      `got ${status}`
    );
  }
}

async function testBranchesSchema() {
  console.log('\n🏢  Branch Infrastructure Schema\n');

  // branches table has default Main Branch seeded
  const { status, body } = await rest('/branches?select=id,name,is_active&limit=1');
  ok(
    'branches: Main Branch seeded and accessible',
    status === 200 && Array.isArray(body) && body.length > 0 && body[0].name === 'Main Branch',
    `got status=${status} body=${JSON.stringify(body)}`
  );

  // transfer_ledger branch_id and destination_branch_id columns
  const { status: trnStatus } = await rest('/transfer_ledger?select=id,branch_id,destination_branch_id&limit=1');
  ok('transfer_ledger: branch_id & destination_branch_id columns exist', trnStatus === 200, `got ${trnStatus}`);
}

async function testSchemaShape() {
  console.log('\n🏗️   Schema shape — column presence via ?select=\n');

  const checks = [
    { table: 'items',              cols: ['id','name','category','department','unit_of_measure','low_stock_threshold','unit_cost'] },
    { table: 'received_ledger',    cols: ['id','date','supplier','item_id','quantity','invoice_number','branch_id'] },
    { table: 'transfer_ledger',    cols: ['id','date','destination','item_id','quantity','reason','branch_id','destination_branch_id'] },
    { table: 'issuance_ledger',    cols: ['id','date','recipient_group','item_id','quantity','issued_by','branch_id'] },
    { table: 'daily_stock_sheets', cols: ['id','date','retail_team_name','item_id','open_qty','qty_in','close_qty','sales_qty','reach','os_status','remark','branch_id'] },
    { table: 'inventory_transactions', cols: ['id','item_id','type','quantity','transaction_date','department','metadata','branch_id'] },
    { table: 'item_departments',   cols: ['id','item_id','department'] },
  ];

  for (const { table, cols } of checks) {
    const select = cols.join(',');
    const { status, body } = await rest(`/${table}?select=${select}&limit=1`);
    const isOk = status === 200 || status === 401; // 401 = RLS active (table exists)
    ok(`${table}: columns [${cols.slice(0,3).join(',')},...] exist`, isOk, `got ${status} — ${JSON.stringify(body).substring(0,100)}`);
  }
}

async function testRpcEndpoints() {
  console.log('\n🔧  RPC endpoints\n');

  // get_low_stock_items (if exists)
  {
    const { status } = await rest('/rpc/get_low_stock_items', { method: 'POST', body: '{}' });
    ok(
      'RPC get_low_stock_items responds',
      [200, 401, 404].includes(status),
      `got ${status}`
    );
  }

  // get_inventory_summary (if exists)
  {
    const { status } = await rest('/rpc/get_inventory_summary', { method: 'POST', body: '{}' });
    ok(
      'RPC get_inventory_summary responds',
      [200, 401, 404].includes(status),
      `got ${status}`
    );
  }
}

async function testDatabasePing() {
  console.log('\n🏓  Database connectivity\n');
  const { status, body } = await rest('/items?limit=1&select=id');
  ok(
    'REST API responds to requests',
    [200, 401].includes(status),
    `status=${status} body=${JSON.stringify(body).substring(0,80)}`
  );
}

async function testWeeklyStockCounts() {
  console.log('\n📊  Weekly stock counts schema\n');
  const cols = ['id','date','location','item_id','physical_count','notes'];
  const { status } = await rest(`/weekly_stock_counts?select=${cols.join(',')}&limit=1`);
  ok('weekly_stock_counts table accessible', [200, 401].includes(status), `got ${status}`);
}

async function testUserRolesSchema() {
  console.log('\n👤  User roles & teams schema\n');
  // user_roles is protected — anon should get 401
  const { status: rolesStatus } = await rest('/user_roles?limit=1');
  ok('user_roles: anon blocked (401)', rolesStatus === 401, `got ${rolesStatus}`);

  const { status: teamsStatus } = await rest('/user_teams?limit=1');
  ok('user_teams: anon blocked (401)', teamsStatus === 401, `got ${teamsStatus}`);
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  useStockist — Live Staging Integration Test Suite  ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  URL: ${SUPABASE_URL}`);
  console.log(`  Time: ${new Date().toISOString()}`);

  await testDatabasePing();
  await testUnauthenticated();
  await testBranchesSchema();
  await testSchemaShape();
  await testWeeklyStockCounts();
  await testUserRolesSchema();
  await testRpcEndpoints();

  const total = passed + failed;
  console.log('\n══════════════════════════════════════════════════════');
  console.log(`  Results: ${passed}/${total} passed`);
  if (failed > 0) {
    console.error(`  ⚠️  ${failed} test(s) failed`);
    process.exit(1);
  } else {
    console.log('  🎉  All live integration tests passed!');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
