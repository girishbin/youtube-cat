<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchPlaylistVideos } from '$lib/services/youtube.service';
  import type { YouTubeVideo } from '$lib/types/youtube.types';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Fuse from 'fuse.js';

  let playlistId: string = '';
  let searchTerm: string = '';
  let searchResults: YouTubeVideo[] = [];
  let syncedItems: YouTubeVideo[] = [];

  const FUSE_OPTIONS = {
    keys: ['title', 'description'],
    threshold: 0.3,
  };
  let fuse: Fuse<YouTubeVideo>;

  onMount(() => {
    // Load from local storage on mount
    const storedItems = localStorage.getItem('youtubeVideos');
    if (storedItems) {
      syncedItems = JSON.parse(storedItems);
      fuse = new Fuse(syncedItems, FUSE_OPTIONS);
      searchResults = syncedItems; // Display all synced items initially
    }
  });

  async function syncPlaylist() {
    if (!playlistId) return;
    try {
      const items = await fetchPlaylistVideos(playlistId);

      // Avoid duplicates by checking existing IDs
      const existingIds = new Set(syncedItems.map(v => v.id));
      const newItems = items.filter(item => !existingIds.has(item.id));
      syncedItems = [...syncedItems, ...newItems];

      localStorage.setItem('youtubeVideos', JSON.stringify(syncedItems));
      fuse = new Fuse(syncedItems, FUSE_OPTIONS);
      performSearch(); // Update search results after syncing
      playlistId = ''; // Clear input
    } catch (error) {
      console.error('Error syncing playlist:', error);
      alert('Failed to sync playlist. Check console for details.');
    }
  }

  function performSearch() {
    if (!fuse) {
      searchResults = syncedItems;
      return;
    }
    if (searchTerm) {
      searchResults = fuse.search(searchTerm).map(result => result.item);
    } else {
      searchResults = syncedItems;
    }
  }

  // Reactively update search results when searchTerm changes
  $: searchTerm, performSearch();
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">YouTube Playlist Sync & Search</h1>

  <div class="flex space-x-2 mb-6">
    <Input
      type="text"
      placeholder="Enter YouTube Playlist ID"
      bind:value={playlistId}
      class="flex-grow"
    />
    <Button on:click={syncPlaylist}>Sync Playlist</Button>
  </div>

  <div class="mb-6">
    <Input
      type="text"
      placeholder="Search synced videos..."
      bind:value={searchTerm}
    />
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {#each searchResults as item (item.id)}
     <Card>
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription class="line-clamp-2">{item.description}</CardDescription>
        </CardHeader>
        <CardContent>
         <img src={item.thumbnail} alt={item.title} class="w-full h-auto rounded-md object-cover mb-2" />
        </CardContent>
        <CardFooter>
          <a href={`https://www.youtube.com/watch?v=${item.id}`} target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">
            Watch Video
          </a>
        </CardFooter>
      </Card>
    {:else}
      <p>No synced videos yet. Sync a playlist to get started!</p>
    {/each}
  </div>
</div>
