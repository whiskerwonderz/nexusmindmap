# NexusMindMap

A visual tool for mapping your knowledge, skills, learnings and journeys as interconnected constellations.

## Features

### Builder Mode
Build and visualize your knowledge, skills, and ideas as an interconnected graph.

**Graph Visualization**
- Interactive node-based canvas
- Multiple layout algorithms: Radial, Constellation. Cluster, Hierarchy
- Drag-and-drop node positioning
- Zoom and pan navigation

**Node Management**
- Create nodes with title, description, and tags
- Connect nodes with labeled relationships
- Color-coded by category or custom colors
- Search and filter by tags

**Data**
- Import CSV; Export CSV / HTML format
- Project management (save, load, duplicate locally)
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

**Trip Management**
- Add, edit, and delete trips
- Multi-stop journey support
- Filter by: All trips, Journeys only, Destinations only
- Filter by year
- Search and sort trips (by date, duration, name)

**Data**
- Import CSV; Export CSV / HTML format
- Statistics: total trips, countries visited, cities explored

## Tech Stack

- **Framework**: SvelteKit 2 with Svelte 5
- **Styling**: TailwindCSS
- **3D Globe**: Globe.gl
- **2D Map**: MapLibre GL
- **Graph Layout**: D3.js
- **Storage**: Browser localStorage (no backend required)

## License

MIT
