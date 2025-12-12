# Friendly

A GIS-based social platform with event discovery, real-time chat, and map integration—powered by **Firebase Realtime Database**.


<img width="2816" height="1536" alt="friendly-banner" src="https://github.com/user-attachments/assets/e9ac594d-4255-47e2-b301-bafc721c2f84" />


## Project Structure

```
├── client/          # React + Vite frontend
│   └── src/
│       ├── api/           # Firebase client & API helpers
│       ├── assets/        # Images, global styles
│       ├── components/    # Reusable UI (common, layout, map, chat, events)
│       ├── context/       # React Context providers (Auth, Event, Map)
│       ├── hooks/         # Custom hooks (useAuth, useGeolocation, useRealtimeChat, useEvents)
│       ├── pages/         # Route-level page components
│       └── router/        # React Router configuration
└── server/          # Node.js + Express backend
    └── src/
        ├── config/        # Firebase Admin SDK & env config
        ├── controllers/   # HTTP request handlers
        ├── middleware/    # Auth verification, error handling
        ├── routes/        # API route definitions
        ├── services/      # Business logic & Firestore queries
        └── utils/         # Helper functions
```

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (recommended) or npm/yarn
- A **Firebase** project with Realtime Database enabled:
  - Database URL: `https://friendly-2fb02-default-rtdb.europe-west1.firebasedatabase.app`
  - Firebase Authentication enabled

### Install Dependencies

```bash
pnpm install          # installs workspaces for client & server
```

### Environment Variables

Create `.env` files in both `client/` and `server/`:

**client/.env**
**client/.env**

```
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<sender-id>
VITE_FIREBASE_APP_ID=<app-id>
```

**server/.env**

```
PORT=4000
FIREBASE_SERVICE_ACCOUNT_KEY=<JSON string of your service account>
```
### Run Development Servers

```bash
# Terminal 1 – client
cd client && pnpm dev

# Terminal 2 – server
cd server && pnpm dev
```

The client runs at `http://localhost:5173` and the server at `http://localhost:4000`.

## License

MIT
