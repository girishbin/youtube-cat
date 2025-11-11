<script lang="ts">
  import { onMount } from 'svelte';
  import { initGoogleAuth, trySilentSignIn, authLoading, checkSession } from '$lib/services/auth.service';
  import AppHeader from '$lib/components/app-header.svelte';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import '../app.css'; // Import global styles

  onMount(async () => {
    // Initialize the Google Auth service when the application starts.
    initGoogleAuth().then(() => {
      trySilentSignIn(); // This now internally checks for existing session first
    }).catch(error => {
      console.error("Failed to initialize Google Auth on app startup:", error);
    });
  });
</script>

<div class="min-h-screen flex flex-col">
  <AppHeader />
  {#if $authLoading}
    <main class="flex-grow flex items-center justify-center">
      <p class="text-gray-500">Loading user session...</p>
    </main>
  {:else}
    <main class="flex-grow">
      <slot />
    </main>
  {/if}
  <AppSidebar />
</div>