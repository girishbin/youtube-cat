<script lang="ts">
  // Assuming shadcn-svelte Card component is used
  import * as Card from '$lib/components/ui/card'; // Adjust path based on your shadcn-svelte setup

  export let video: {
    id: string;
    title: string;
    thumbnail: string;
    description: string;
  }; // Replace with your actual Video type
</script>

<Card.Root class="w-full">
  <Card.Header>
    <img src={video.thumbnail} alt={video.title} class="w-full h-auto object-cover rounded-md mb-2" />
    <Card.Title>{video.title}</Card.Title>
  </Card.Header>
  <Card.Content>
    <p class="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
  </Card.Content>
</Card.Root>