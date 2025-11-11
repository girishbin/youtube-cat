// src/routes/api/auth/session/+server.ts
import { json } from '@sveltejs/kit';
import { getSession } from '$lib/server/db/db.service';

export async function GET({ cookies }) {
  try {
    const sessionId = cookies.get('session_id');

    if (!sessionId) {
      return json({ user: null });
    }

    const session = await getSession(sessionId);

    if (session) {
      return json({ user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        picture: session.user.picture,
      }});
    }

    // If session is invalid or expired, clear the cookie
    cookies.delete('session_id', { path: '/' });
    return json({ user: null });
  } catch (e) {
    console.error('Session API error:', e);
    return json({ user: null }, { status: 500 });
  }
}