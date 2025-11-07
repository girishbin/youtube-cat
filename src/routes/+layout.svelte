<script lang="ts">
  import AppHeader from '$lib/components/app-header.svelte';
  import AppSidebar from '$lib/components/app-sidebar.svelte';
  import '../app.css'; // Import global styles
</script>

<div class="min-h-screen flex flex-col">
  <AppHeader />
  <main class="flex-grow">
    <slot />
  </main>
  <AppSidebar />
</div>