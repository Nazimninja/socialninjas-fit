import { createClient } from '@supabase/supabase-js'

// Backend + WebAuthn helpers (ported from the vanilla app).
export const IS_APPLE = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent)
export const IS_ANDROID = /Android/.test(navigator.userAgent)
export const BIO = IS_APPLE ? 'Face ID / Touch ID' : IS_ANDROID ? 'fingerprint or face unlock' : 'your fingerprint, face or PIN'
export const VAULT = IS_APPLE ? 'iCloud Keychain' : IS_ANDROID ? 'Google Password Manager' : 'your password manager'
export const webauthnOK = () => !!(window.PublicKeyCredential && navigator.credentials)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://mocqyvmntemsnmdusjcy.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vY3F5dm1udGVtc25tZHVzamN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4OTMwMzAsImV4cCI6MjEwMDQ2OTAzMH0.qt4ty1tjGeXMthhSaDZZo80u_JdPK4klUg3QAIhN0nw'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  }
})

// Unauthenticated public client (bypasses any user token header overrides from Google OAuth session)
export const supabasePublic = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
})

export const ADMIN_EMAILS = [
  'nazim.socialninja@gmail.com',
  'nazimpasha906@gmail.com',
  'nazim@socialninjas.in',
  'admin@socialninjas.in',
  'support@socialninjas.in',
  'fit@socialninjas.in'
]

export const VERIFIED_PAID_MEMBERS = [
  'saqlainsharief161@gmail.com',
  'highonnfitness@gmail.com'
]

export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/app'
      }
    })
    return { data, error }
  } catch (err) {
    return { error: err }
  }
}

export async function signInWithApple() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: window.location.origin + '/app',
        skipBrowserRedirect: true
      }
    })
    if (error) return { error }
    if (!data?.url) return { error: { message: 'Could not initialize Apple Sign In' } }

    // Check if the Apple OAuth provider is enabled in Supabase backend
    try {
      const checkRes = await fetch(data.url, { method: 'GET' })
      if (checkRes.status === 400) {
        const body = await checkRes.json().catch(() => ({}))
        if (body?.msg?.includes('Unsupported provider') || body?.error_code === 'validation_failed') {
          return {
            error: {
              message: 'Apple Sign-In is being provisioned. Please continue with Google or your Email/Phone below.',
              isProviderDisabled: true
            }
          }
        }
      }
    } catch (e) {
      // If network check fails, continue
    }

    // Provider is enabled - redirect athlete
    window.location.assign(data.url)
    return { data }
  } catch (err) {
    return { error: err }
  }
}

export async function verifyMemberEmail(email) {
  const clean = (email || '').trim().toLowerCase()
  if (!clean) return { verified: false, error: 'Email address is required' }

  // 1. Admin / Owner / Verified Members check
  if (ADMIN_EMAILS.includes(clean) || clean.endsWith('@socialninjas.in') || VERIFIED_PAID_MEMBERS.includes(clean)) {
    return { verified: true, role: (ADMIN_EMAILS.includes(clean) || clean.endsWith('@socialninjas.in')) ? 'admin' : 'member', email: clean }
  }

  // 2. Query Supabase DB for active membership or saved state
  try {
    const candidates = [clean]
    const digits = clean.replace(/\D/g, '')
    if (digits.length >= 10) {
      if (!clean.startsWith('+')) candidates.push('+' + digits)
      candidates.push(digits)
      if (digits.length === 10) candidates.push('+91' + digits)
      if (digits.startsWith('91') && digits.length === 12) candidates.push(digits.slice(2))
    }

    // Check fitninja_membership using public unauthenticated client (immune to OAuth session state)
    const { data: memRows } = await supabasePublic
      .from('scripts')
      .select('*')
      .eq('profile', 'fitninja_membership')
      .in('topic', candidates)
      .limit(1)

    if (memRows && memRows.length > 0) {
      return { verified: true, email: clean }
    }

    // Check existing synced user state (if user state exists, they are active)
    const { data: stateRows } = await supabasePublic
      .from('scripts')
      .select('*')
      .eq('profile', 'fitninja_user_state')
      .in('topic', candidates)
      .limit(1)

    if (stateRows && stateRows.length > 0) {
      return { verified: true, email: clean }
    }

    // Check leads table by email or phone
    const { data: leadRows } = await supabasePublic
      .from('leads')
      .select('*')
      .or(`email.in.(${candidates.map(c => `"${c}"`).join(',')}),phone.in.(${candidates.map(c => `"${c}"`).join(',')})`)
      .limit(1)

    if (leadRows && leadRows.length > 0 && (leadRows[0].status?.includes('PAID') || leadRows[0].status?.includes('MEMBER'))) {
      return { verified: true, email: clean }
    }
  } catch (err) {
    console.warn('Supabase membership lookup warning:', err)
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
    error: 'No active Pro subscription found for this email. Please subscribe above to unlock Fit Ninja.'
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
