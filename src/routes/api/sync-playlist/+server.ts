// src/routes/api/sync-playlist/+server.ts
import { json, error } from '@sveltejs/kit';
import { getSession, getOAuthTokenByUserId, saveOrUpdateOAuthToken } from '$lib/server/db/db.service';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';
import { GOOGLE_CLIENT_SECRET } from '$env/static/private';

const YOUTUBE_PLAYLISTS_API_URL = 'https://www.googleapis.com/youtube/v3/playlists';
const YOUTUBE_PLAYLIST_ITEMS_API_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

async function getValidAccessToken(userId: string): Promise<string> {
  const tokenInfo = await getOAuthTokenByUserId(userId);

  if (!tokenInfo) {
    throw error(401, 'No OAuth token found for user.');
  }

  // If token is not expired (with a 5-minute buffer), return it
  if (tokenInfo.expiresAt && tokenInfo.expiresAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return tokenInfo.accessToken;
  }

  // If token is expired, use refresh token to get a new one
  if (!tokenInfo.refreshToken) {
    throw error(401, 'Token expired and no refresh token available.');
  }

  console.log('Access token expired, refreshing...');
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: tokenInfo.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    throw error(500, 'Failed to refresh access token.');
  }

  const newTokens = await response.json();
  await saveOrUpdateOAuthToken({
    userId: userId,
    provider: 'google',
    accessToken: newTokens.access_token,
    refreshToken: tokenInfo.refreshToken, // Refresh token usually stays the same
    expiresAt: new Date(Date.now() + newTokens.expires_in * 1000),
    scope: newTokens.scope,
  });

  return newTokens.access_token;
}

export async function POST({ request, cookies }) {
  const session = await getSession(cookies.get('session_id') || '');
  if (!session) {
    throw error(401, 'Unauthorized');
  }

  const accessToken = await getValidAccessToken(session.user.id);

  try {
    // Step 1: Fetch all of the user's playlists
    const playlistIds: string[] = [];
    let playlistsNextPageToken: string | undefined = undefined;
    do {
      const playlistsUrl = `${YOUTUBE_PLAYLISTS_API_URL}?part=id&mine=true&maxResults=50${playlistsNextPageToken ? `&pageToken=${playlistsNextPageToken}` : ''}`;
      const playlistsResponse = await fetch(playlistsUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!playlistsResponse.ok) throw new Error('Failed to fetch user playlists.');
      const playlistsData = await playlistsResponse.json();
      playlistsData.items.forEach((item: any) => playlistIds.push(item.id));
      playlistsNextPageToken = playlistsData.nextPageToken;
    } while (playlistsNextPageToken);

    if (playlistIds.length === 0) {
      return json([]); // User has no playlists
    }

    // Step 2: For each playlist, fetch all of its videos
    const allVideoItems: any[] = [];
    const fetchPromises = playlistIds.map(async (playlistId) => {
      let itemsNextPageToken: string | undefined = undefined;
      do {
        const itemsUrl = `${YOUTUBE_PLAYLIST_ITEMS_API_URL}?part=snippet&playlistId=${playlistId}&maxResults=50${itemsNextPageToken ? `&pageToken=${itemsNextPageToken}` : ''}`;
        const itemsResponse = await fetch(itemsUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!itemsResponse.ok) {
          // Log and skip this playlist if it fails (e.g., deleted or private)
          console.warn(`Failed to fetch items for playlist ${playlistId}. Skipping.`);
          return;
        }
        const itemsData = await itemsResponse.json();
        allVideoItems.push(...itemsData.items);
        itemsNextPageToken = itemsData.nextPageToken;
      } while (itemsNextPageToken);
    });

    await Promise.all(fetchPromises);

    return json(allVideoItems);

  } catch (e: any) {
    console.error('Sync Playlist API Error:', e);
    throw error(500, e.message || 'An internal error occurred while syncing playlists.');
  }
}