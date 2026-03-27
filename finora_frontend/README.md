# Finora Frontend

Next.js frontend for the Finora market intelligence platform.

## Local Development

Create `finora_frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Run the frontend:

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npm exec tsc -- --noEmit
npm run build
```

For complete setup instructions, see the root `README.md`.
