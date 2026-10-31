# relay

This project was created with [kubojs](https://github.com/albuquerquesz/kubo), a modern TypeScript stack that combines React, TanStack Router, Elysia, TRPC, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Himetrica** - Browser analytics, error tracking, and Web Vitals
- **MillionSend** - Cloud or self-hosted email via packages/millionsend
- **TanStack Router** - File-based routing with full type safety
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Elysia** - Type-safe, high-performance framework
- **tRPC** - End-to-end type-safe APIs
- **Bun** - Runtime environment
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system
- **Biome** - Linting and formatting

## Getting Started

First, install the dependencies:

```bash
bun install
```
## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/server/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:
```bash
bun run db:push
```





## Himetrica Setup

This project includes the [Himetrica TypeScript tracker](https://www.himetrica.com/docs/web).

1. Create a Himetrica project and copy its public tracker key (`hm_pk_...`).
2. Set the generated web `.env` value ending in `HIMETRICA_API_KEY`.
3. Page views, uncaught errors, and Web Vitals are collected automatically when the key is configured.
4. Add product events with the SDK's `track` method; do not send secrets, source code, or raw user input.

The generated integration is browser-only. Keep Himetrica secret keys out of client projects and use the Himetrica Server API from a server-only module for trusted backend events.


## MillionSend Setup

This project includes the official [MillionSend TypeScript SDK](https://github.com/MillionSend/millionsend-node) through `packages/millionsend`.

1. Set `MILLIONSEND_API_KEY` (`ms_...`) in `apps/server/.env` **before importing the client**. The SDK creates the client once and throws if the key is missing.
2. Replace `MILLIONSEND_FROM_EMAIL` with a verified domain sender. The generated `noreply@example.com` address is a placeholder.
3. Cloud uses `https://api.millionsend.com`. For self-hosting, set `MILLIONSEND_BASE_URL` to your API origin. Loopback HTTP is allowed; other plain HTTP origins require explicitly changing the client's SDK options to `allowInsecureHttp: true`. HTTPS is recommended.



```ts
import { millionsend, sendEmail } from "@relay/millionsend";

await sendEmail({
  to: "user@example.com",
  subject: "Hello",
  html: "<strong>It works!</strong>",
  idempotencyKey: "welcome/user-123",
});

// The complete SDK is available, including received mail and inboxes.
const { data, error } = await millionsend.emails.receiving.list({ inboxId: "your-inbox-id" });
```

Reuse an idempotency key for retries of the same send. The helper returns the sent data and throws on SDK errors; the raw client returns `{ data, error }`.


Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@relay/ui/components/button"
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.



## Git Hooks and Formatting

- Run checks: `bun run check`



## Project Structure

```
relay/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Router)
│   └── server/      # Backend API (Elysia, TRPC)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:server`: Start only the server
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run check`: Run Biome formatting and linting
