import { writable } from 'svelte/store';
import type { YouTubeVideo } from '$lib/types/youtube.types';

interface DataState {
  videos: YouTubeVideo[];
  isSyncing: boolean;
  lastSyncTime: Date | null;
}

export const data = writable<DataState>({
  videos: [],
  isSyncing: false,
  lastSyncTime: null,
});