<script lang="ts">
  import { onMount } from 'svelte';
  import { initializeFuse, searchVideos } from '$lib/services/search.service';
  import type { YouTubeVideo } from '$lib/types/youtube.types';
  import { Input } from '$lib/components/ui/input';
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '$lib/components/ui/card';
  import { user } from '$lib/stores/user.store';

  let searchTerm: string = '';
  let searchResults: YouTubeVideo[] = [];
  let syncedItems: YouTubeVideo[] = [];
  let isSyncing: boolean = false;
  let localStorageSize: string = '0 KB';

  const FUSE_OPTIONS = {
	keys: ['title', 'description'],
	threshold: 0.3
  };

  onMount(() => {
    const storedItems = localStorage.getItem('youtubeVideos');
    if (storedItems) {
      syncedItems = JSON.parse(storedItems);
      initializeFuse(syncedItems);
      checkLocalStorageSize();
    }
  });

  function checkLocalStorageSize() {
    let totalBytes = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          // Each character in a JS string is typically 2 bytes (UTF-16)
          totalBytes += (key.length + value.length) * 2;
        }
      }
    }
    const totalKB = totalBytes / 1024;
    const totalMB = totalKB / 1024;

    localStorageSize = totalMB >= 1 ? `${totalMB.toFixed(2)} MB` : `${totalKB.toFixed(2)} KB`;
    console.log(`Current localStorage usage: ${localStorageSize}`);
  }

  async function syncPlaylist() {
    console.log('syncPlaylist function called.');
    if (isSyncing) return;
    isSyncing = true;
    try {
      const response = await fetch('/api/sync-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to sync playlist.');
      }

      const playlistItems = await response.json();
      
      const items: YouTubeVideo[] = playlistItems.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      }));

      // Deduplicate the combined list of old and new items
      const existingIds = new Set(syncedItems.map(v => v.id));
      const allItems = [...syncedItems, ...items];
      const uniqueItems = allItems.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      syncedItems = uniqueItems;

      localStorage.setItem('youtubeVideos', JSON.stringify(syncedItems));
      initializeFuse(syncedItems);
      checkLocalStorageSize(); // Recalculate size after syncing
    } catch (error) {
      console.error('Error syncing playlist:', error);
      alert('Failed to sync playlist. Check console for details.');
    } finally {
      isSyncing = false;
    }
  }

  // Reactively update search results when searchTerm or syncedItems change
  $: if (!searchTerm) {
    searchResults = syncedItems;
  } else {
    searchResults = searchVideos(searchTerm);
  }
</script>

<div class="p-4">
  <h1 class="text-2xl font-bold mb-4">YouTube Playlist Sync & Search</h1>

  {#if $user.isLoggedIn}
    <p>User is logged in: {$user.isLoggedIn}</p> <!-- Added for debugging -->
    <div class="flex space-x-2 mb-6">
      <button
        on:click={syncPlaylist}
        class="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={isSyncing}
      >
        {#if isSyncing}
          Syncing...
        {:else}
          Sync All Playlists
        {/if}
      </button>
    </div>
    <div class="text-sm text-gray-500 mb-6">
      <span>Estimated Local Storage Usage: <strong>{localStorageSize}</strong> (Limit is ~5-10 MB)</span>
    </div>
  {:else}
    <p class="mb-6 text-center text-gray-600 bg-gray-100 p-4 rounded-md">
      Please sign in to sync your YouTube playlists.
    </p>
  {/if}

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
      {#if $user.isLoggedIn}
        <p>No synced videos yet. Sync a playlist to get started!</p>
      {:else}
        <p>Sign in and sync a playlist to see your videos here.</p>
      {/if}
    {/each}
  </div>
</div>
