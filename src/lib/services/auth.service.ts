import { setUser, type UserProfile } from '$lib/stores/user.store';
import { PUBLIC_GOOGLE_CLIENT_ID } from '$env/static/public';

declare global {
  interface Window {
    google: typeof google;
  }
}

let googleInitialized = false;

/**
 * Handles the credential response from Google Sign-In.
 * Decodes the JWT token and updates the user store.
 * @param response The credential response from Google.
 */
function handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
  if (response.credential) {
    try {
      // Decode the JWT token to get user profile information.
      // In a production application, you should send this JWT to your backend for verification.
      const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
      const profile: UserProfile = {
        id: decodedToken.sub,
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture,
      };
      setUser(profile);
      console.log('User signed in:', profile.name);
    } catch (error) {
      console.error('Error decoding Google credential:', error);
      setUser(null);
    }
  } else {
    setUser(null);
  }
}

/**
 * Initializes the Google Identity Services client.
 * This should be called once when the application loads.
 */
export function initGoogleAuth() {
  if (typeof window !== 'undefined' && !googleInitialized && window.google?.accounts?.id) {
    google.accounts.id.initialize({ client_id: PUBLIC_GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
    googleInitialized = true;
    console.log('Google Identity Services initialized.');
  }
}

/**
 * Triggers the Google Sign-In prompt.
 */
export function signIn() {
  if (typeof window !== 'undefined' && googleInitialized) {
    google.accounts.id.prompt(); // Displays the One Tap or Sign-in dialog
  } else {
    console.warn('Google Auth not initialized or not in browser environment.');
  }
}

/**
 * Signs out the user from Google Identity Services and clears local user state.
 */
export function signOut() {
  if (typeof window !== 'undefined' && googleInitialized) {
    google.accounts.id.disableAutoSelect(); // Prevents automatic re-login
    setUser(null);
    console.log('User signed out.');
  }
}