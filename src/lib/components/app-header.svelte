<script lang="ts">
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/user.store';
  import { initGoogleAuth, signIn, signOut } from '$lib/services/auth.service';
  import { Button } from '$lib/components/ui/button';

  onMount(() => {
    initGoogleAuth();
  });
</script>

<header class="bg-primary text-primary-foreground p-4 flex justify-between items-center">
  <h1 class="text-xl font-bold">My YouTube Playlist Search App</h1>
  <nav>
    {#if $user.isLoggedIn && $user.profile}
      <div class="flex items-center gap-3">
        <img src={$user.profile.picture} alt={$user.profile.name} class="h-10 w-10 rounded-full" />
        <Button variant="secondary" on:click={signOut}>Sign Out</Button>
      </div>
    {:else}
      <Button variant="secondary" on:click={signIn}>Sign In with Google</Button>
    {/if}
  </nav>
</header>