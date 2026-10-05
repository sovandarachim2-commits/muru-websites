import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:net'

const workspace = fileURLToPath(new URL('../../', import.meta.url))
const temporary = await mkdtemp(join(tmpdir(), 'muru-cms-test-'))
const probe = createServer()
await new Promise((resolve) => probe.listen(0, '127.0.0.1', resolve))
const port = probe.address().port
await new Promise((resolve) => probe.close(resolve))
const backend = spawn(process.env.PHP_BINARY || 'C:/xampp/php/php.exe', ['-S', `127.0.0.1:${port}`, 'backend/router.php'], { cwd: workspace, env: { ...process.env, MURU_CMS_DATA_DIR: temporary }, stdio: 'ignore' })
const base = `http://127.0.0.1:${port}/api/cms/`
let cookie = ''
let csrf = ''
async function request(path, body, options = {}) {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf, ...options.headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) })
  const setCookie = response.headers.get('set-cookie')
  if (setCookie) cookie = setCookie.split(';')[0]
  const text = await response.text()
  try { return { status: response.status, data: JSON.parse(text) } }
  catch { throw new Error(`Invalid API response: ${text}`) }
}
const state = {
  products: [
    { id: 'one', slug: 'test-cleanser', title: 'Test cleanser', category: 'Skincare', type: 'Cleanser', benefit: 'Daily care', price: 8.5, image: '', variant: 'pump', tone: 'pink', status: 'published' },
    { id: 'two', slug: 'draft-cream', title: 'Draft cream', category: 'Skincare', type: 'Cream', benefit: 'Daily care', price: 12, image: '', variant: 'jar', tone: 'rose', status: 'draft' },
  ],
  categories: [{ title: 'Skincare', text: 'Daily care', variant: 'pump', tone: 'pink' }],
  social: Object.fromEntries(['facebook', 'instagram', 'telegram', 'tiktok'].map(key => [key, 'https://example.com'])),
  settings: {
    brand: 'Test MURU',
    tagline: 'Daily care.',
    heroEyebrow: 'New',
    heroTitle: 'Test hero',
    heroAccent: 'Every day',
    heroDescription: 'Test description',
    heroButton: 'Shop',
    catalogTitle: 'Catalog',
    catalogDescription: 'Catalog description',
    storyTitle: 'Story',
    storyDescription: 'Story description',
    promotionTitle: 'Promotion',
    promotionDescription: 'Promotion description',
    contactTitle: 'Contact',
    contactDescription: 'Contact description',
    heroImage: '',
    storyImage: '',
    promotionImage: '',
    accentColor: '#e83e73',
    bodyFont: 'DM Sans',
    showPromotion: true,
    showReviews: true,
  },
}
try {
  let ready = false
  for (let count = 0; count < 50; count++) {
    try { await request('session'); ready = true; break } catch (error) { if (count === 49) console.error(error); await new Promise(resolve => setTimeout(resolve, 100)) }
  }
  assert.ok(ready, 'PHP test server must start')
  assert.equal((await request('admin')).status, 401)
  assert.equal((await request('session')).data.setupRequired, true)
  assert.equal((await request('session', undefined, { headers: { Host: '192.168.142.1:5173' } })).data.setupAllowed, true)
  assert.equal((await request('setup', { email: 'test@example.com', password: 'short', state })).status, 422)
  const auth = await request('setup', { email: 'test@example.com', password: 'Integration-test-password-123', state })
  assert.equal(auth.status, 200)
  csrf = auth.data.csrf
  assert.equal((await request('setup', { email: 'test@example.com', password: 'Integration-test-password-123', state })).status, 409)
  assert.equal((await request('catalog')).data.state.products.length, 1)
  assert.equal((await request('save', { state, revision: 1 }, { headers: { 'X-CSRF-Token': '' } })).status, 403)
  assert.equal((await request('save', { state, revision: 1 }, { headers: { Origin: 'https://other.example' } })).status, 403)
  state.products[1].status = 'published'
  state.settings.heroTitle = 'Updated hero'
  const save = await request('save', { state, revision: 1 })
  assert.equal(save.status, 200)
  assert.equal(save.data.revision, 2)
  assert.equal((await request('catalog')).data.state.products.length, 2)
  assert.equal((await request('catalog')).data.state.settings.heroTitle, 'Updated hero')
  assert.equal((await request('save', { state, revision: 1 })).status, 409)
  state.products[0].image = 'data:image/svg+xml;base64,PHN2Zy8+'
  assert.equal((await request('save', { state, revision: 2 })).status, 422)
  state.products[0].image = ''
  state.products[1].slug = state.products[0].slug
  assert.equal((await request('save', { state, revision: 2 })).status, 422)
  state.products[1].slug = 'draft-cream'
  assert.equal((await request('password', { currentPassword: 'incorrect', password: 'Updated-password-123' })).status, 422)
  assert.equal((await request('password', { currentPassword: 'Integration-test-password-123', password: 'Updated-password-123' })).status, 200)
  assert.equal((await request('logout', {})).status, 200)
  assert.equal((await request('admin')).status, 401)
  assert.equal((await request('login', { email: 'test@example.com', password: 'Integration-test-password-123' })).status, 401)
  const login = await request('login', { email: 'test@example.com', password: 'Updated-password-123' })
  assert.equal(login.status, 200)
  csrf = login.data.csrf
  assert.equal((await request('profile', { name: 'Test Owner', username: 'owner' })).status, 200)
  const profileSession = await request('session')
  assert.equal(profileSession.data.name, 'Test Owner')
  assert.equal(profileSession.data.username, 'owner')
  assert.equal((await request('admin')).data.revision, 2)
  assert.equal((await request('access', { kind: 'roles', id: 'viewer', name: 'Viewer', permissions: [] })).status, 200)
  assert.equal((await request('access', { kind: 'roles', id: 'owner', name: 'Changed', permissions: [] })).status, 422)
  assert.equal((await request('access', { kind: 'users', email: 'viewer@example.com', username: 'viewer', name: 'Viewer', role: 'viewer', active: true, password: '12345678' })).status, 200)
  assert.equal((await request('access', { kind: 'roles', id: 'viewer', delete: true })).status, 422)
  const ownerCookie = cookie
  const ownerCsrf = csrf
  await request('logout', {})
  const viewerLogin = await request('login', { email: 'viewer', password: '12345678' })
  assert.equal(viewerLogin.status, 200)
  csrf = viewerLogin.data.csrf
  assert.deepEqual((await request('session')).data.permissions, [])
  assert.equal((await request('access')).status, 403)
  assert.equal((await request('upload', { image: 'not-an-image' })).status, 403)
  assert.equal((await request('access', { kind: 'roles', id: 'escalation', name: 'Escalation', permissions: ['users'] })).status, 403)
  const currentState = (await request('admin')).data.state
  currentState.settings.brand = 'Unauthorized'
  assert.equal((await request('save', { state: currentState, revision: 2 })).status, 403)
  cookie = ownerCookie
  csrf = ownerCsrf
  const ownerLogin = await request('login', { email: 'owner', password: 'Updated-password-123' })
  csrf = ownerLogin.data.csrf
  assert.equal((await request('access', { kind: 'users', email: 'viewer@example.com', username: 'viewer', name: 'Viewer', role: 'viewer', active: false })).status, 200)
  assert.equal((await request('login', { email: 'viewer@example.com', password: '12345678' })).status, 401)
  console.log('CMS integration passed: setup, login, publishing, shared saves, conflicts, CSRF, image validation, password change and logout.')
} finally {
  const exited = new Promise(resolve => backend.once('exit', resolve))
  backend.kill()
  if (backend.exitCode === null) await exited
  if (!resolve(temporary).startsWith(resolve(tmpdir()) + '\\') && !resolve(temporary).startsWith(resolve(tmpdir()) + '/')) throw new Error('Unexpected cleanup path')
  await rm(temporary, { recursive: true, force: true })
}
