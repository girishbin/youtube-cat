Build a app where youtube playlist and its content is synced to local browser storage using fuse.js.
When I search , these youtube saved should be displayed.

/my-youtube-playlist-search-app
│
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├──-
│   │   │   │   ├── app-header.svelte     # The main header with title and auth buttons
│   │   │   │   └── app-sidebar.svelte     # A footer with links to privacy policy, etc.
│   │   │   │
│   │   │   ├── search/
│   │   │       ├── SearchBar.svelte  # The input component for typing search queries
│   │   │       ├── ResultsList.svelte# The component that renders the list of results,  use shadcn-svelte components
│   │   │       └── VideoCard.svelte  # The display card for a single video result,  use shadcn-svelte card component
│   │   │   
│   │   │   
│   │   │   
│   │   │   
│   │   │
│   │   ├── services/
│   │   │   ├── auth.service.ts       # Handles all Google Auth logic (GAPI/GIS init, sign-in, sign-out)
│   │   │   ├── youtube.service.ts    # Handles all YouTube Data API calls (fetching playlists, videos)
│   │   │   └── search.service.ts     # Handles all Fuse.js logic (creating the index, running searches)
│   │   │
│   │   ├── stores/
│   │   │   ├── user.store.ts         # Svelte store for user authentication state (isLoggedIn, profile info)
│   │   │   └── data.store.ts         # Svelte store for video data, sync status (isSyncing), and last sync time
│   │   │
│   │   ├── types/
│   │   │   └── youtube.types.ts      # TypeScript interfaces for API objects (PlaylistItem, Snippet, etc.)
│   │   │
│   │   └── utils/
│   │       ├── constants.ts          # App-wide constants (like your CLIENT_ID, API scopes)
│   │       └── storage.helpers.ts    # Helper functions for safely interacting with localStorage/IndexedDB
│   │
│   ├── routes/
│   │   ├── +layout.svelte            # The main layout component for all pages (imports app-header.svelte, app-sidebar.svelte)
│   │   ├── +page.svelte              # The main application page, orchestrating all components and logic
│   │   │
│   │   └── privacy/
│   │       └── +page.svelte          # A simple, static page for your Privacy Policy
│   │


I'm butilding a app which 
