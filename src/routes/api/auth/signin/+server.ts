// src/routes/api/auth/signin/+server.ts
import { json, error } from '@sveltejs/kit';
import { findUserByEmail, createUser, updateUser, createSession, saveOrUpdateOAuthToken } from '$lib/server/db/db.service';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
import { GOOGLE_CLIENT_SECRET } from '$env/static/private';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

export async function POST({ request, cookies }) {
  try {
    const { code } = await request.json();

    if (!code) {
      throw error(400, 'Authorization code is required.');
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: 'postmessage', // Important for web clients
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json();
      console.error('Google token exchange failed:', errorBody);
      throw error(500, 'Failed to exchange authorization code for tokens.');
    }

    const tokens = await tokenResponse.json();

    // 2. Use access token to get user profile
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      throw error(500, 'Failed to fetch user info from Google.');
    }

    const googleProfile = await userInfoResponse.json();

    if (!googleProfile || !googleProfile.sub) {
      throw error(401, 'Invalid Google access token.');
    }

    let user = await findUserByEmail(googleProfile.email);

    if (user) {
      // Update existing user data if necessary
      user = (await updateUser(user.id, {
        name: googleProfile.name,
        picture: googleProfile.picture,
        emailVerified: googleProfile.email_verified,
        updatedAt: new Date(),
      })) || user;
    } else {
      // Create new user
      user = await createUser({
        id: googleProfile.sub,
        email: googleProfile.email,
        name: googleProfile.name,
        picture: googleProfile.picture,
        emailVerified: googleProfile.email_verified,
      });
    }

    // 3. Save OAuth tokens to the database
    await saveOrUpdateOAuthToken({
      userId: user.id,
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token, // This may be null on subsequent sign-ins
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      scope: tokens.scope,
    });

    // Create a new session
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    const sessionId = await createSession(user.id, expiresAt);

    cookies.set('session_id', sessionId, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
      sameSite: 'lax',
      expires: expiresAt,
    });

    return json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (e: any) {
    console.error('Sign-in API error:', e);
    throw error(e.status || 500, e.message || 'Internal server error during sign-in.');
  }
}