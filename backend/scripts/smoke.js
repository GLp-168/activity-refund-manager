import assert from 'node:assert/strict'
import { once } from 'node:events'
import { createApp } from '../src/app.js'
import { env } from '../src/config/env.js'
import { closeDatabase } from '../src/config/db.js'

if (!env.dbName.endsWith('_test')) throw new Error('Smoke writes fixtures; DB_NAME must end in _test.')
const server = createApp().listen(0, '127.0.0.1')
await once(server, 'listening')
const base = `http://127.0.0.1:${server.address().port}`
let token
const request = async (path, body, { method = body ? 'POST' : 'GET', auth = false, status = 200 } = {}) => {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await response.json()
  assert.equal(response.status, status, `${path}: ${JSON.stringify(payload)}`)
  return payload.data
}
try {
  assert.equal((await fetch(base + '/health')).status, 200)
  await request('/api/admin/stores', undefined, { status: 401 })
  await request('/api/admin/auth/login', { username: env.adminUsername, password: 'wrong' }, { status: 401 })
  token = (await request('/api/admin/auth/login', { username: env.adminUsername, password: env.adminPassword })).token
  const auth = { auth: true }
  const store = await request('/api/admin/stores', { name: 'Smoke demo store', platform_type: 'other' }, auth)
  const config = await request('/api/admin/weight-configs', {
    name: 'Smoke rules', platform_type: 'all', is_default: true,
    config: { min_rating: 1, keyword_rules: [], image_rule: { min_images: 0, score: 1 }, passing_score: 1 },
  }, auth)
  const activity = await request('/api/admin/activities', {
    name: 'Smoke activity', product_intro: 'Fictional test fixture', product_images: ['/demo-product.svg'],
    status: 'active', max_participants: 10, weight_config_id: config.id,
    store_links: [{ store_id: store.id, product_url: 'https://example.com/demo' }],
  }, auth)
  const signupBody = { activity_id: activity.id, store_id: store.id, wechat_nickname: 'Smoke user', phone_number: '00000000000' }
  const signup = await request('/api/signups', signupBody)
  await request('/api/signups', signupBody, { status: 400 })
  const ordered = await request(`/api/signups/${signup.signup_id}`, {
    order_number: 'DEMO-ORDER', alipay_account: 'demo@example.com', alipay_name: 'Demo user',
  }, { method: 'PUT' })
  assert.equal(ordered.status, 'ordered')
  await request(`/api/admin/signups/${signup.signup_id}`, { refund_amount: 1 }, { ...auth, method: 'PUT' })
  const evaluated = await request('/api/admin/comments/fetch', {
    comments: [{ signup_id: signup.signup_id, rating: 3, content: 'Demo comment', images: [] }],
  }, auth)
  assert.equal(evaluated.items[0].status, 'pending_refund')
  const batch = await request('/api/admin/refunds/batch', { signup_ids: [signup.signup_id] }, auth)
  assert.equal(batch.records[0].status, 'success')
  await request('/api/admin/refunds/batch', { signup_ids: [signup.signup_id] }, { ...auth, status: 400 })
  const sms = await request('/api/admin/refunds/notify', { signup_ids: [signup.signup_id] }, auth)
  assert.equal(Number(sms.items[0].sms_sent), 1)
  const query = new URLSearchParams({ activity_id: activity.id, wechat_nickname: 'Smoke user', phone_number: '00000000000' })
  const result = await request(`/api/signups/query?${query}`)
  assert.equal(result.items[0].status, 'refunded')
  console.log('PASS: health, auth boundaries, store/activity/rules, signup, duplicate protection, order, comment evaluation, simulated refund/SMS, query.')
} finally {
  await new Promise((resolve) => server.close(resolve))
  await closeDatabase()
}
