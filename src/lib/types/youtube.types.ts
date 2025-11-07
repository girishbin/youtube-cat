// TypeScript interfaces for YouTube Data API objects

export interface YouTubeThumbnail {
  url: string;
  width: number;
  height: number;
}

export interface YouTubeSnippet {
  publishedAt: string;
  channelId: string;
  title: string;
  description: string;
  thumbnails: {
    default: YouTubeThumbnail;
    medium: YouTubeThumbnail;
    high: YouTubeThumbnail;
  };
  channelTitle: string;
  playlistId?: string; // For playlist items
  position?: number; // For playlist items
  resourceId?: {
    kind: string;
    videoId: string;
  }; // For playlist items
}

export interface YouTubePlaylistItem {
  id: string;
  snippet: YouTubeSnippet;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string; // Simplified for easier use in components
  // Add other relevant fields as needed
}