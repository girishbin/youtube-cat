// This file will handle all YouTube Data API calls (fetching playlists, videos)

import { PUBLIC_GOOGLE_API_KEY } from '$env/static/public';
import type { YouTubePlaylistItem, YouTubeVideo } from '$lib/types/youtube.types';

export const fetchPlaylists = async (): Promise<YouTubePlaylistItem[]> => {
  // Logic to fetch user's YouTube playlists
  return [];
};

/**
 * Fetches all videos from a given YouTube playlist, handling pagination.
 * @param playlistId The ID of the YouTube playlist.
 * @returns A promise that resolves to an array of simplified YouTube video objects.
 */
export const fetchPlaylistVideos = async (playlistId: string): Promise<YouTubeVideo[]> => {
	let allVideos: YouTubeVideo[] = [];
	let nextPageToken: string | undefined = undefined;
	const apiKey = PUBLIC_GOOGLE_API_KEY;
	const baseUrl = 'https://www.googleapis.com/youtube/v3/playlistItems';

	if (!apiKey || apiKey === 'YOUR_GOOGLE_API_KEY') {
		console.error('YouTube API key is not configured.');
		alert('Please configure your Google API Key in the environment variables.');
		return [];
	}

	try {
		do {
			const params = new URLSearchParams({
				part: 'snippet',
				playlistId: playlistId,
				maxResults: '50',
				key: apiKey
			});

			if (nextPageToken) {
				params.append('pageToken', nextPageToken);
			}

			const response = await fetch(`${baseUrl}?${params.toString()}`);
			const data = await response.json();

			if (data.error) {
				throw new Error(data.error.message);
			}

			const videos = data.items.map((item: YouTubePlaylistItem) => ({
				id: item.snippet.resourceId?.videoId || item.id,
				title: item.snippet.title,
				description: item.snippet.description,
				thumbnail: item.snippet.thumbnails.medium.url
			}));

			allVideos = [...allVideos, ...videos];
			nextPageToken = data.nextPageToken;
		} while (nextPageToken);

		return allVideos;
	} catch (error) {
		console.error('Failed to fetch playlist videos:', error);
		throw error; // Re-throw the error to be caught by the caller
	}
};