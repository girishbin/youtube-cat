// This file will handle all YouTube Data API calls (fetching playlists, videos)

import type { YouTubePlaylistItem, YouTubeVideo } from '$lib/types/youtube.types';

/**
 * Fetches all playlists for the currently authenticated user, handling pagination.
 * @returns A promise that resolves to an array of the user's playlists.
 */
export const fetchPlaylists = async (): Promise<YouTubePlaylistItem[]> => {
	try {
		let allPlaylists: YouTubePlaylistItem[] = [];
		let nextPageToken: string | undefined = undefined;

		do {
			// The gapi client automatically uses the authenticated user's credentials.
			const response = await window.gapi.client.youtube.playlists.list({
				part: 'snippet,contentDetails',
				mine: true,
				maxResults: 50,
				pageToken: nextPageToken
			});

			allPlaylists = [...allPlaylists, ...response.result.items];
			nextPageToken = response.result.nextPageToken;
		} while (nextPageToken);

		return allPlaylists;
	} catch (error) {
		console.error('Failed to fetch playlists:', error);
		throw error;
	}
};

/**
 * Fetches all videos from a given YouTube playlist, handling pagination.
 * @param playlistId The ID of the YouTube playlist.
 * @returns A promise that resolves to an array of simplified YouTube video objects.
 */
export const fetchPlaylistVideos = async (playlistId: string): Promise<YouTubeVideo[]> => {
	let allVideos: YouTubeVideo[] = [];
	let nextPageToken: string | undefined = undefined;

	try {
		do {
			const response = await window.gapi.client.youtube.playlistItems.list({
				part: 'snippet',
				playlistId: playlistId,
				maxResults: 50,
				pageToken: nextPageToken
			});

			const videos = response.result.items.map((item: any) => ({
				id: item.snippet.resourceId?.videoId || item.id,
				title: item.snippet.title,
				description: item.snippet.description,
				thumbnail: item.snippet.thumbnails?.medium?.url || ''
			}));

			allVideos = [...allVideos, ...videos];
			nextPageToken = response.result.nextPageToken;
		} while (nextPageToken);

		return allVideos;
	} catch (error) {
		console.error('Failed to fetch playlist videos:', error);
		throw error;
	}
};