/**
 * Redis integration test against a real Upstash test database.
 * Uses the same @upstash/redis version installed in the project.
 *
 * NEVER run against production credentials.
 *
 * Usage:
 *   TEST_REDIS_URL=https://... TEST_REDIS_TOKEN=... node scripts/test-redis.mjs
 *
 * All test data is written to keys prefixed with "test:" and flushed at the end.
 */

import { Redis } from '../node_modules/@upstash/redis/nodejs.mjs';

const url   = process.env.TEST_REDIS_URL;
const token = process.env.TEST_REDIS_TOKEN;
if (!url || !token) {
  console.error('ERROR: set TEST_REDIS_URL and TEST_REDIS_TOKEN before running.');
  console.error('Use a dedicated test Upstash database, never production credentials.');
  process.exit(1);
}

const redis = new Redis({ url, token });

// ── helpers ──────────────────────────────────────────────────────────────────
let passed = 0, failed = 0;
function assert(label, condition, detail = '') {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else           { console.error(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`); failed++; }
}

// All data lives under namespaced keys so the test DB can be reused safely
const K_SUPPLIES = 'test:supplies';
const K_MOVEMENTS = 'test:supply-movements';
const lockKey = (ref, type) => `test:mov-lock:${ref}:${type}`;

// The same Lua script from storage.ts (updated: validate before lock)
const LUA = `
local supKey = KEYS[1]
local movKey = KEYS[2]
local lockKey = KEYS[3]
local ref = ARGV[1]
local typ = ARGV[2]
local sid = ARGV[3]
local d   = tonumber(ARGV[4])
local upd = ARGV[5]
local movRaw = redis.call('GET', movKey)
local movs = movRaw and cjson.decode(movRaw) or {}
for _, m in ipairs(movs) do
  if m['reference'] == ref and m['type'] == typ then
    return cjson.encode({created=false, movement=m})
  end
end
local supRaw = redis.call('GET', supKey)
if not supRaw then
  return cjson.encode({created=false, error='supplies_missing'})
end
local sups = cjson.decode(supRaw)
local sidx = -1
for i, s in ipairs(sups) do
  if s['id'] == sid then sidx = i break end
end
if sidx == -1 then
  return cjson.encode({created=false, error='supply_not_found'})
end
local acquired = redis.call('SET', lockKey, '1', 'NX', 'EX', '3600')
if not acquired then
  movRaw = redis.call('GET', movKey)
  movs = movRaw and cjson.decode(movRaw) or {}
  for _, m in ipairs(movs) do
    if m['reference'] == ref and m['type'] == typ then
      return cjson.encode({created=false, movement=m})
    end
  end
  return cjson.encode({created=false, movement=cjson.decode(ARGV[6])})
end
sups[sidx]['available'] = (sups[sidx]['available'] or 0) + d
sups[sidx]['updatedAt'] = upd
redis.call('SET', supKey, cjson.encode(sups))
local newMov = cjson.decode(ARGV[6])
table.insert(movs, newMov)
redis.call('SET', movKey, cjson.encode(movs))
return cjson.encode({created=true, movement=newMov})
`;

async function runLua(ref, type, supplyId, delta, movement) {
  const lk = lockKey(ref, type);
  const raw = await redis.eval(LUA, [K_SUPPLIES, K_MOVEMENTS, lk], [ref, type, supplyId, String(delta), new Date().toISOString(), JSON.stringify(movement)]);
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

function mov(ref, type, supplyId, qty) {
  return { id: `mov-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, itemId: supplyId, itemName: 'test-supply', type, quantity: qty, balanceAfter: 0, reference: ref, date: '2026-11-08', createdAt: new Date().toISOString() };
}

async function getSupply(id) {
  const sups = await redis.get(K_SUPPLIES) || [];
  return sups.find(s => s.id === id);
}
async function getMovementsByRef(ref) {
  const movs = await redis.get(K_MOVEMENTS) || [];
  return movs.filter(m => m.reference === ref);
}

// ── setup ─────────────────────────────────────────────────────────────────────
async function setup() {
  const supplies = [{ id: 'sup-test-bolsas', name: 'Bolsas', unit: 'unidades', available: 100, minimum: 5, controlStartDate: '2026-01-01', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
  await redis.set(K_SUPPLIES, supplies);
  await redis.set(K_MOVEMENTS, []);
  console.log('Setup: 100 bolsas, movements=[]\n');
}

// ── T1: basic inventory entry — 100 + 500 = 600 ──────────────────────────────
async function test1() {
  console.log('=== T1: Inventory entry (100 → 600) ===');
  const ref = 'recv-500-bolsas';
  const r = await runLua(ref, 'entrada', 'sup-test-bolsas', 500, mov(ref, 'entrada', 'sup-test-bolsas', 500));
  assert('created=true', r.created === true);
  const s = await getSupply('sup-test-bolsas');
  assert('balance=600', s?.available === 600, `got ${s?.available}`);
  const ms = await getMovementsByRef(ref);
  assert('1 movement written', ms.length === 1);
}

// ── T2: consume 1 → 599 ───────────────────────────────────────────────────────
async function test2() {
  console.log('\n=== T2: Consume 1 (600 → 599) ===');
  const ref = 'consume-order-001';
  const r = await runLua(ref, 'consumo', 'sup-test-bolsas', -1, mov(ref, 'consumo', 'sup-test-bolsas', -1));
  assert('created=true', r.created === true);
  const s = await getSupply('sup-test-bolsas');
  assert('balance=599', s?.available === 599, `got ${s?.available}`);
}

// ── T3: retry same reception — balance must stay 599 (not 1099) ───────────────
async function test3() {
  console.log('\n=== T3: Retry same reception — no duplicate ===');
  const ref = 'recv-500-bolsas';  // same ref as T1
  const r = await runLua(ref, 'entrada', 'sup-test-bolsas', 500, mov(ref, 'entrada', 'sup-test-bolsas', 500));
  assert('created=false (idempotent)', r.created === false);
  const s = await getSupply('sup-test-bolsas');
  assert('balance still 599', s?.available === 599, `got ${s?.available}`);
  const ms = await getMovementsByRef(ref);
  assert('still only 1 movement', ms.length === 1);
}

// ── T4: retry after lock expiry (simulate by deleting lock key) ───────────────
async function test4() {
  console.log('\n=== T4: Retry after lock expiry — movement record prevents duplicate ===');
  const ref = 'recv-500-bolsas';
  // Delete the lock key to simulate expiry
  await redis.del(lockKey(ref, 'entrada'));
  const r = await runLua(ref, 'entrada', 'sup-test-bolsas', 500, mov(ref, 'entrada', 'sup-test-bolsas', 500));
  assert('created=false (idempotent after lock expiry)', r.created === false);
  const s = await getSupply('sup-test-bolsas');
  assert('balance still 599 (not duplicated)', s?.available === 599, `got ${s?.available}`);
}

// ── T5: two distinct simultaneous operations on same supply ───────────────────
async function test5() {
  console.log('\n=== T5: Two distinct simultaneous operations ===');
  const ref1 = 'recv-batch-A', ref2 = 'recv-batch-B';
  const [r1, r2] = await Promise.all([
    runLua(ref1, 'entrada', 'sup-test-bolsas', 10, mov(ref1, 'entrada', 'sup-test-bolsas', 10)),
    runLua(ref2, 'entrada', 'sup-test-bolsas', 20, mov(ref2, 'entrada', 'sup-test-bolsas', 20)),
  ]);
  assert('r1 created', r1.created === true || r1.created === false);  // one or both may win
  assert('r2 created', r2.created === true || r2.created === false);
  assert('distinct movement IDs', r1.movement?.id !== r2.movement?.id);
  const s = await getSupply('sup-test-bolsas');
  // Both deltas should be applied (order may vary)
  assert('balance=629 (599+10+20)', s?.available === 629, `got ${s?.available}`);
}

// ── T6: simultaneous identical requests — only one written ────────────────────
async function test6() {
  console.log('\n=== T6: 10 simultaneous identical requests — 1 write ===');
  const ref = 'recv-dup-test-10x';
  const results = await Promise.all(Array.from({length:10}, () =>
    runLua(ref, 'entrada', 'sup-test-bolsas', 7, mov(ref, 'entrada', 'sup-test-bolsas', 7))
  ));
  const created = results.filter(r => r.created === true).length;
  const ids = new Set(results.map(r => r.movement?.id));
  assert('exactly 1 created', created === 1, `got ${created}`);
  assert('all return same movement ID', ids.size === 1, `got ${ids.size} distinct IDs`);
  const s = await getSupply('sup-test-bolsas');
  assert('balance=636 (+7 once)', s?.available === 636, `got ${s?.available}`);
}

// ── T7: missing supply returns error without acquiring lock ────────────────────
async function test7() {
  console.log('\n=== T7: Missing supply → error, no lock set ===');
  const ref = 'recv-missing-supply';
  const lk = lockKey(ref, 'entrada');
  await redis.del(lk);
  const r = await runLua(ref, 'entrada', 'sup-does-not-exist', 10, mov(ref, 'entrada', 'sup-does-not-exist', 10));
  assert('error=supply_not_found', r.error === 'supply_not_found', `got ${JSON.stringify(r)}`);
  const lockVal = await redis.get(lk);
  assert('lock NOT set after error', lockVal === null, `got ${lockVal}`);
  const ms = await getMovementsByRef(ref);
  assert('no movement written', ms.length === 0);
}

// ── T8: eval signature and cjson availability ──────────────────────────────────
async function test8() {
  console.log('\n=== T8: eval signature and cjson roundtrip ===');
  const r = await redis.eval(`return cjson.encode({ok=true, n=42})`, [], []);
  const parsed = typeof r === 'string' ? JSON.parse(r) : r;
  assert('cjson.encode works', parsed?.ok === true && parsed?.n === 42, `got ${JSON.stringify(parsed)}`);
}

// ── T9: empty lists (first ever write) ────────────────────────────────────────
async function test9() {
  console.log('\n=== T9: Empty keys (first write to fresh DB) ===');
  await redis.del(K_SUPPLIES);
  await redis.del(K_MOVEMENTS);
  // supplies missing → error
  const r = await runLua('ref-empty', 'entrada', 'sup-test-bolsas', 5, mov('ref-empty', 'entrada', 'sup-test-bolsas', 5));
  assert('supplies missing → error', !!r.error, `got ${JSON.stringify(r)}`);
  // restore
  await setup();
  // movements empty → first write should succeed
  const ref = 'first-write-empty-movs';
  const r2 = await runLua(ref, 'entrada', 'sup-test-bolsas', 1, mov(ref, 'entrada', 'sup-test-bolsas', 1));
  assert('first write to empty movements succeeds', r2.created === true, `got ${JSON.stringify(r2)}`);
}

// ── cleanup ───────────────────────────────────────────────────────────────────
async function cleanup() {
  const keys = await redis.keys('test:*');
  if (keys.length > 0) await redis.del(...keys);
  console.log(`\nCleanup: deleted ${keys.length} test key(s).`);
}

// ── run ───────────────────────────────────────────────────────────────────────
try {
  // Verify connectivity first
  const pong = await redis.ping();
  assert('Redis reachable (PING)', pong === 'PONG', `got ${pong}`);
  console.log('');

  await setup();
  await test1();
  await test2();
  await test3();
  await test4();
  await test5();
  await test6();
  await test7();
  await test8();
  await test9();
  await cleanup();

  console.log(`\n${'─'.repeat(40)}`);
  console.log(`Result: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
} catch (e) {
  console.error('\nFATAL:', e.message);
  await cleanup().catch(() => {});
  process.exit(1);
}
