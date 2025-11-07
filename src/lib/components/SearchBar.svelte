<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  let searchQuery: string = '';
  const dispatch = createEventDispatcher();

  function handleSearch() {
    dispatch('search', searchQuery);
  }
</script>

<div class="flex gap-2 p-4">
  <input type="text" bind:value={searchQuery} placeholder="Search YouTube playlists..." class="flex-grow p-2 border rounded-md" />
  <button on:click={handleSearch} class="bg-primary text-primary-foreground px-4 py-2 rounded-md">Search</button>
</div>