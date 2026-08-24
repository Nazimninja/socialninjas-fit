import { createClient } from '@supabase/supabase-js'

// Backend + WebAuthn helpers (ported from the vanilla app).
export const IS_APPLE = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
export const IS_ANDROID = /Android/.test(navigator.userAgent)
export const BIO = IS_APPLE ? 'Face ID / Touch ID' : IS_ANDROID ? 'fingerprint or face unlock' : 'your fingerprint, face or PIN'
export const VAULT = IS_APPLE ? 'iCloud Keychain' : IS_ANDROID ? 'Google Password Manager' : 'your password manager'
export const webauthnOK = () => !!(window.PublicKeyCredential && navigator.credentials)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2OTk0ODUsImV4cCI6MjA2NjI3NTQ4NX0.d9Y10-s4v2-eJzZ4w6Jz118sE7qN8c8Y9o9o9o9o9o9'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ADMIN_EMAILS = [
  'nazimpasha906@gmail.com',
  'nazim@socialninjas.in',
  'admin@socialninjas.in',
  'support@socialninjas.in',
  'fit@socialninjas.in'
]

export async function verifyMemberEmail(email) {
  const clean = (email || '').trim().toLowerCase()
  if (!clean) return { verified: false, error: 'Email address is required' }

  // 1. Admin / Owner Email Whitelist check
  if (ADMIN_EMAILS.includes(clean)) {
    return { verified: true, role: 'admin', email: clean }
  }

  // 2. Check local verified payment token on this device
  try {
    const paidEmail = (localStorage.getItem('gym_paid_email') || '').trim().toLowerCase()
    if (paidEmail && paidEmail === clean) {
      return { verified: true, email: clean }
    }
  } catch (e) {}

  // 3. Query Supabase DB for active subscription/user
  try {
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('email', clean)
      .maybeSingle()

    if (user && (user.paid || user.role === 'admin' || user.subscription_status === 'active')) {
      return { verified: true, email: clean, user }
    }

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('email', clean)
      .maybeSingle()

    if (sub && (sub.status === 'active' || sub.status === 'authenticated')) {
      return { verified: true, email: clean, subscription: sub }
    }
  } catch (err) {
    console.warn('Supabase lookup warning:', err)
  }

  // 4. Serverless API verification check (if endpoint active)
  try {
    const res = await fetch('/api/verify-member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: clean })
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      if (data && data.verified) return { verified: true, email: clean, role: data.role }
    }
  } catch (e) {}

  return {
    verified: false,
    error: 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninjas.'
  }
}

export async function api(path, opts) {
  const r = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts))
  const data = await r.json().catch(() => ({}))
  if (!r.ok) { const e = new Error(data.error || ('HTTP ' + r.status)); e.status = r.status; throw e }
  return data
}

const bufToB64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64uToBuf = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)).buffer

function toCreationOptions(o) {
  o.challenge = b64uToBuf(o.challenge)
  o.user.id = b64uToBuf(o.user.id)
  ;(o.excludeCredentials || []).forEach(c => { c.id = b64uToBuf(c.id) })
  return o
}
function toRequestOptions(o) {
  o.challenge = b64uToBuf(o.challenge)
  ;(o.allowCredentials || []).forEach(c => { c.id = b64uToBuf(c.id) })
  return o
}
function credToJSON(cred) {
  const r = cred.response
  const out = {
    id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type,
    clientExtensionResults: cred.getClientExtensionResults ? cred.getClientExtensionResults() : {},
    authenticatorAttachment: cred.authenticatorAttachment || null,
    response: { clientDataJSON: bufToB64u(r.clientDataJSON) }
  }
  if (r.attestationObject) {
    out.response.attestationObject = bufToB64u(r.attestationObject)
    out.response.transports = r.getTransports ? r.getTransports() : ['internal']
  }
  if (r.authenticatorData) {
    out.response.authenticatorData = bufToB64u(r.authenticatorData)
    out.response.signature = bufToB64u(r.signature)
    out.response.userHandle = r.userHandle ? bufToB64u(r.userHandle) : null
  }
  return out
}
export async function passkeyRegister(name, code) {
  const { cid, options } = await api('/api/register/options', { method: 'POST', body: JSON.stringify({ name, code: code || '' }) })
  const cred = await navigator.credentials.create({ publicKey: toCreationOptions(options) })
  const res = await api('/api/register/verify', { method: 'POST', body: JSON.stringify({ cid, credential: credToJSON(cred) }) })
  return res.user
}
export async function passkeyLogin() {
  const { cid, options } = await api('/api/login/options', { method: 'POST', body: '{}' })
  const cred = await navigator.credentials.get({ publicKey: toRequestOptions(options) })
  const res = await api('/api/login/verify', { method: 'POST', body: JSON.stringify({ cid, credential: credToJSON(cred) }) })
  return res.user
}
