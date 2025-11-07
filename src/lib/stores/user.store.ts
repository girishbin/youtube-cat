import { writable } from 'svelte/store';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  picture: string;
}

interface UserStore {
  isLoggedIn: boolean;
  profile: UserProfile | null;
}

const initialUser: UserStore = { isLoggedIn: false, profile: null };

export const user = writable<UserStore>(initialUser);

export function setUser(profile: UserProfile | null) {
  user.set(profile ? { isLoggedIn: true, profile } : initialUser);
}