# LAST ZONE: EXTRACTION

A browser-based multiplayer extraction shooter prototype built with TypeScript, Three.js and Colyseus.

## Stack
- Vite + TypeScript
- Three.js
- Colyseus
- Express + Node.js

## Requirements
- Node.js 20+
- npm 10+

## Install

```bash
npm install
```

## Run development

```bash
npm run dev
```

This starts:
- Server: ws://localhost:2567
- Client: http://localhost:5173

## Create and join a room

1. Open the client in your browser.
2. Click Create room.
3. Copy the room code shown in the UI.
4. Open another browser tab or device.
5. Paste the room code and click Join room.

## Production deployment

Set the production WebSocket URL on the client and host the server behind HTTPS / WSS.

Example:

```bash
VITE_SERVER_URL=wss://your-domain.example
```

The server should be exposed through a reverse proxy such as nginx, Caddy, or Traefik with TLS termination. A Docker setup can also be added later for a full deployment pipeline.

## Project structure

```text
client/     frontend and 3D gameplay
server/     authoritative Colyseus room server
shared/     shared protocol and types
```

## Current state
This is the working multiplayer foundation for the game.

Implemented:
- real Colyseus server room
- create and join room flow
- two-client online room synchronization
- 3D environment with fog, lighting, and movement
- third-person camera
- basic shooting event and health sync
- mobile-friendly interface shell

Not yet complete:
- full extraction loop
- inventory and loot system
- enemy NPC AI
- advanced weapons and animations
- persistent player accounts
- production deployment pipeline
- full map and mission content
