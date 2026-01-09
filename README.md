# NexusMindMap

A visual tool for mapping your knowledge, skills, and journeys as interconnected constellations.

## Features

### Builder Mode
Build and visualize your knowledge, skills, and ideas as an interconnected graph.

**Graph Visualization**
- Interactive node-based canvas
- Multiple layout algorithms: Force, Radial, Hierarchy, Constellation
- Drag-and-drop node positioning
- Zoom and pan navigation

**Node Management**
- Create nodes with title, description, and tags
- Connect nodes with labeled relationships
- Color-coded by category or custom colors
- Search and filter by tags

**Data**
- Import/Export JSON format
- Project management (save, load, duplicate)
- Demo project included

### Explorer Mode
Map your travels and adventures across the world.

**3D Globe View**
- Interactive rotating globe with animated flight arcs
- Multiple globe styles: Night, Dark, Satellite, Topology
- Click on routes to view trip details
- Home base marker with visual indicator

**2D Map View**
- Flat map powered by MapLibre GL
- Glowing route lines connecting destinations
- Multiple map styles: Dark Matter, Light, Voyager

**Timeline View**
- Cinematic vertical timeline of your journeys
- Chronological visualization with trip cards
- Visual connection lines between events

**Trip Management**
- Add, edit, and delete trips
- Multi-stop journey support
- Filter by: All trips, Journeys only, Destinations only
- Filter by year
- Search and sort trips (by date, duration, name)

**Data**
- Import/Export JSON and CSV formats
- Export map as image
- Statistics: total trips, countries visited, cities explored

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: TailwindCSS
- **3D Globe**: Globe.gl
- **2D Map**: MapLibre GL
- **Graph Layout**: D3.js
- **Storage**: Browser localStorage (no backend required)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## Deployment

This is a static site that can be deployed to GitHub Pages, Vercel, Netlify, or any static hosting.

## License

MIT
