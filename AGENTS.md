# Project Conventions

## Frontend (React + TypeScript + Vite)

### Build & Typecheck
```bash
cd frontend
npm run build       # tsc -b && vite build
npx tsc --noEmit    # type-check only
npm run lint        # eslint
```

### Dev
```bash
cd frontend
npm run dev         # Vite dev server with /api proxy to localhost:4000
```

## Backend (Node + Express + Mongoose)

### Build & Run
```bash
cd backend
npm run dev         # tsx watch
npm run build       # tsc -> dist/
```

### Lint
```bash
cd backend
npm run lint
```
