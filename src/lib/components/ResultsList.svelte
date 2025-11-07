<script lang="ts">
  import VideoCard from './VideoCard.svelte';
  // Assuming shadcn-svelte list components might be used for styling the container
  // import { List, ListItem } from '$lib/components/ui/list'; // Example import, adjust based on actual shadcn-svelte components

  export let results: any[] = []; // Replace 'any' with your actual Video type
</script>

<div class="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {#if results.length > 0}
    {#each results as video (video.id)}
      <VideoCard {video} />
    {/each}
  {:else}
    <p class="col-span-full text-center text-muted-foreground">No results found. Try syncing your playlists!</p>
  {/if}
</div>

<!-- Consider using shadcn-svelte components for list styling, e.g., <List> and <ListItem> if applicable. -->