import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'

const run = (overrides, code = "await import('./src/config/env.js')") => spawnSync(
  process.execPath, ['--input-type=module', '-e', code], {
    cwd: new URL('../', import.meta.url), encoding: 'utf8',
    env: { ...process.env, JWT_SECRET: randomBytes(32).toString('hex'),
      ADMIN_PASSWORD: randomBytes(16).toString('hex'), ...overrides },
  },
)

test('missing, short and placeholder secrets fail before startup', () => {
  for (const overrides of [
    { JWT_SECRET: '' }, { JWT_SECRET: 'dev-secret' },
    { ADMIN_PASSWORD: '' }, { ADMIN_PASSWORD: 'admin123' },
    { JWT_SECRET: 'replace-me-with-a-long-placeholder-secret' },
    { ADMIN_PASSWORD: 'replace-me-with-a-unique-password' },
  ]) assert.notEqual(run(overrides).status, 0)
})

test('valid configuration defaults to loopback and disables schema alteration', () => {
  const result = run({ HOST: '', DB_SYNC: '' }, `
    const {env} = await import('./src/config/env.js');
    if(env.host !== '127.0.0.1' || env.dbSync !== false) process.exit(1);
  `)
  assert.equal(result.status, 0, result.stderr)
})

test('configured admin can authenticate; bad credentials and tampered tokens fail', () => {
  const result = run({}, `
    const assert = (await import('node:assert/strict')).default;
    const {env} = await import('./src/config/env.js');
    const {authenticateAdmin, verifyToken} = await import('./src/services/auth-service.js');
    const {token} = authenticateAdmin(env.adminUsername, env.adminPassword);
    assert.equal(verifyToken(token).role, 'admin');
    assert.throws(() => authenticateAdmin(env.adminUsername, 'wrong-password'));
    assert.throws(() => verifyToken(token + 'x'));
  `)
  assert.equal(result.status, 0, result.stderr)
})
