import { setUser, type UserProfile } from '$lib/stores/user.store';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public'; // Re-enable this
import { writable } from 'svelte/store';
import { browser } from '$app/environment'; // Import browser environment flag

declare global {
  interface Window {
    google: typeof google;
    gapi: any; // Google API Client
  }
}

let googleAuthInitialized: Promise<void> | null = null;
export const authReady = writable(false);
export const authLoading = writable(true); // Start in a loading state

// Configuration for YouTube API access
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

/**
 * Dynamically loads the Google Sign-In script and returns a promise that resolves when it's loaded.
 */
function loadGoogleGsiScript(): Promise<void> {
	return new Promise((resolve, reject) => {
		if (!browser || window.google?.accounts?.id) {
			return resolve();
		}

		const script = document.createElement('script');
		script.src = 'https://accounts.google.com/gsi/client';
		script.async = true;
		script.defer = true;
		script.onload = () => resolve();
		script.onerror = () => reject(new Error('Failed to load Google GSI script.'));
		document.head.appendChild(script);
	});
}

/**
 * Loads the Google API Client (gapi) script.
 */
function loadGapiScript(): Promise<void> {
	return new Promise((resolve) => {
		if (!browser) {
			return resolve();
		}
		const script = document.createElement('script');
		script.src = 'https://apis.google.com/js/api.js';
		script.onload = () => window.gapi.load('client', resolve); // Only load the 'client' part
		document.head.appendChild(script);
	});
}

/**
 * Returns a promise that resolves when the Google Identity Services client is available.
 */
async function getGoogleClient(): Promise<typeof window.google> {
	if (!browser) {
		throw new Error('Not in a browser environment.');
	}
	if (!window.google?.accounts?.id) {
		await loadGoogleGsiScript();
	}
	if (!window.google) {
		throw new Error('Google client not available after loading script.');
	}
	return window.google;
}

/**
 * Initializes the Google Identity Services client.
 * This should be called once when the application loads.
 */
export function initGoogleAuth(): Promise<void> {
  if (!browser) return Promise.resolve(); // Skip if not in browser

  if (!googleAuthInitialized) {
    googleAuthInitialized = (async () => {
      try {
        // Load both GSI and GAPI scripts
        await Promise.all([loadGapiScript(), loadGoogleGsiScript()]);

        // The gapi client is loaded, but not initialized with auth parameters.
        // We will set the access token on it later.
        // We still need to initialize it to load the YouTube discovery doc.
        await window.gapi.client.init({});
        await window.gapi.client.load(DISCOVERY_DOCS[0]);

        console.log('Google Identity Services initialized.');
        authReady.set(true);
      } catch (error) {
        console.error('Failed to initialize Google Auth:', error);
        // Prevent further attempts
        googleAuthInitialized = Promise.reject(error);
        throw error;
      }
    })();
  }
  return googleAuthInitialized;
}

async function handleCodeResponse(codeResponse: google.accounts.oauth2.CodeResponse) {
  if (codeResponse && codeResponse.code) {
    console.log('Authorization code received. Sending to server for token exchange.');
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeResponse.code }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sign in on server.');
      }

      const { user: userData } = await response.json();
      setUser(userData);
      console.log('User signed in and session created:', userData.name);
    } catch (e) {
      console.error('Error fetching user profile:', e);
      setUser(null);
    }
  } else {
    console.warn('handleCodeResponse called with invalid code response.');
  }
  // CRITICAL FIX: Always set loading to false after handling the token response.
  authLoading.set(false);
}

/**
 * Checks for an existing session with the server.
 * @returns {Promise<UserProfile | null>} The user profile if a session exists, otherwise null.
 */
export async function checkSession(): Promise<UserProfile | null> {
  if (!browser) return null;

  try {
    const response = await fetch('/api/auth/session');
    if (response.ok) {
      const { user: userData } = await response.json();
      if (userData) {
        setUser(userData);
        console.log('Existing session found for user:', userData.name);
        return userData;
      }
    }
  } catch (e) {
    console.error('Error checking session:', e);
  } finally {
    authLoading.set(false);
  }
  return null;
}

/**
 * Attempts to sign the user in silently if they have previously granted permission.
 */
export async function trySilentSignIn() {
  authLoading.set(true); // Set loading state at the beginning

  // First, check if a session already exists in the database
  const userFromSession = await checkSession();
  if (userFromSession) {
    // If a session is found, no need to try Google's silent sign-in
    // checkSession's finally block already handles setting authLoading to false
    return;
  }

  // If no session found, proceed with Google's silent sign-in attempt
  try {
    await initGoogleAuth();
    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (codeResponse) => {
        handleCodeResponse(codeResponse);
      },
      error_callback: (error) => {
        console.log('Google silent sign-in failed:', error.message);
        authLoading.set(false); // Also set loading to false on failure
      }
    });
    codeClient.requestCode(); // Silent attempt for code
  } catch (error) {
    console.error('Silent sign-in initialization failed:', error);
    authLoading.set(false);
  }
}

/**
 * Triggers the Google Sign-In prompt.
 */
export async function signIn() {
  authLoading.set(true); // Set loading state when interactive sign-in starts
  try {
    await initGoogleAuth();
    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: PUBLIC_GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: handleCodeResponse
    });
    codeClient.requestCode();
  } catch (error) {
    console.error('Sign-in failed:', error);
    alert('Could not sign in. Please try again later.');
    authLoading.set(false); // Clear loading state on interactive sign-in failure
  }
}

/**
 * Signs out the user by clearing the local session state.
 * This version does NOT revoke the Google token, allowing for a seamless
 * silent sign-in experience on the user's next visit.
 */
export async function signOut() {
  if (!browser) return;

  try {
    await fetch('/api/auth/signout', { method: 'POST' });
    setUser(null);
    console.log('User signed out and server session cleared.');
  } catch (e) {
    console.error('Error during server-side sign-out:', e);
  }
}

/**
 * Signs out the user AND revokes the application's permission.
 * This will require the user to re-grant consent on their next sign-in.
 * Use this for a "Disconnect Account" feature.
 */
export function signOutAndRevoke() {
  if (!browser) return;

  const token = window.gapi?.client?.getToken();
  if (token) {
    window.google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Access token revoked.');
      setUser(null);
    });
  } else {
    setUser(null);
  }
  console.log('User signed out and token revoked.');
}