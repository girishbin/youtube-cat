// src/routes/api/auth/signout/+server.ts
import { json } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/db/db.service';

export async function POST({ cookies }) {
  try {
    const sessionId = cookies.get('session_id');

    if (sessionId) {
      await deleteSession(sessionId);
      cookies.delete('session_id', { path: '/' });
    }

    return json({ message: 'Signed out successfully.' });
  } catch (e) {
    console.error('Sign-out API error:', e);
    return json({ message: 'Internal server error during sign-out.' }, { status: 500 });
  }
}