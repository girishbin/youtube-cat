import Fuse from 'fuse.js';
import type { YouTubeVideo } from '$lib/types/youtube.types';

// This file will handle all Fuse.js logic (creating the index, running searches)

let fuse: Fuse<YouTubeVideo> | null = null;

export const initializeFuse = (videos: YouTubeVideo[]) => {
  const options = {
    keys: ['title', 'description'], // Keys to search within
    threshold: 0.3, // Fuzziness of the search
  };
  fuse = new Fuse(videos, options);
};

export const searchVideos = (query: string): YouTubeVideo[] => {
  if (!fuse) {
    return [];
  }
  if (!query) {
    return fuse.getIndex().docs; // Return all documents when query is empty
  }
  return fuse.search(query).map((result) => result.item);
};