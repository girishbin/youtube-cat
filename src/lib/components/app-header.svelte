<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.store';
  import { initGoogleAuth, signIn, signOut, authReady } from '$lib/services/auth.service';

  onMount(() => {
    initGoogleAuth().catch(err => console.error("Error initializing auth on mount:", err));
  });
</script>

<header class="bg-primary text-primary-foreground p-4 flex justify-between items-center">
  <h1 class="text-xl font-bold">My YouTube Playlist Search App</h1>
  <nav>
    {#if $authReady}
      {#if $user.isLoggedIn && $user.profile}
        <div class="flex items-center gap-3">
          <img src={$user.profile.picture} alt={$user.profile.name} class="h-10 w-10 rounded-full" />
          <button class="bg-secondary text-secondary-foreground px-4 py-2 rounded-md" on:click={signOut}>Sign Out</button>
        </div>
      {:else}
        <button class="bg-secondary text-secondary-foreground px-4 py-2 rounded-md" on:click={signIn}>Sign In with Google</button>
      {/if}
    {/if}
  </nav>
</header>