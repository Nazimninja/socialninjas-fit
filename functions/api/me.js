export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Email',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers, status: 200 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get('email') || request.headers.get('x-user-email') || '';
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanEmail) {
    return new Response(JSON.stringify({ user: null }), { headers, status: 200 });
  }

  const ADMIN_EMAILS = [
    'nazim.socialninja@gmail.com',
    'nazimpasha906@gmail.com',
    'nazim@socialninjas.in',
    'admin@socialninjas.in',
    'support@socialninjas.in',
    'fit@socialninjas.in'
  ];

  const isAdmin = ADMIN_EMAILS.includes(cleanEmail) || cleanEmail.endsWith('@socialninjas.in') || cleanEmail.includes('socialninja');

  return new Response(JSON.stringify({
    user: {
      name: cleanEmail.split('@')[0],
      email: cleanEmail,
      paid: true,
      role: isAdmin ? 'admin' : 'member'
    }
  }), { headers, status: 200 });
}
