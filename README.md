# better-waitlist

[![npm version](https://img.shields.io/npm/v/better-waitlist)](https://www.npmjs.com/package/better-waitlist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/haxurn/better-waitlist)
[![Better Auth](https://img.shields.io/badge/Better_Auth-Plugin-blue)](https://better-auth.com)

Waitlist plugin for [Better Auth](https://github.com/better-auth/better-auth)

**Made by [haxurn](https://github.com/haxurn)**

## Installation

```bash
npm install better-waitlist
```

```bash
pnpm add better-waitlist
```

```bash
yarn add better-waitlist
```

## Usage

### Server

Add the plugin to your Better Auth configuration:

```ts
import { betterAuth } from 'better-auth';
import { waitlist } from 'better-waitlist';

export const auth = betterAuth({
  plugins: [waitlist()],
});
```

### Database Migration

Run the migration to add the waitlist table to your database:

```bash
npx @better-auth/cli migrate
```

Or generate the schema for your ORM:

```bash
npx @better-auth/cli generate
```

### Client

Add the client plugin:

```ts
import { createAuthClient } from 'better-auth/client';
import { waitlistClient } from 'better-waitlist';

export const authClient = createAuthClient({
  plugins: [waitlistClient()],
});
```

## Options

```ts
import { waitlist } from 'better-waitlist';

export const auth = betterAuth({
  plugins: [
    waitlist({
      requireAdmin: true, // require session for admin endpoints (default: true)
    }),
  ],
});
```

## API

### Join Waitlist

```ts
// Anonymous user
await authClient.waitlist.join({ email: 'user@example.com' });

// Logged-in user
await authClient.waitlist.join({
  email: 'user@example.com',
  userId: 'user-123',
});
```

### Check Status

```ts
const { data, error } = await authClient.waitlist.getStatus({
  email: 'user@example.com',
});

if (data) {
  console.log(data.status); // "pending" | "approved" | "rejected"
}
```

### Check Position

```ts
const { data, error } = await authClient.waitlist.getPosition({
  email: 'user@example.com',
});

if (data) {
  console.log(data.position);
}
```

### Admin: List Entries

```ts
const { data, error } = await authClient.waitlist.list({
  status: 'pending', // optional filter
  limit: 20,
  offset: 0,
});

if (data) {
  console.log(data.entries);
  console.log(data.total);
}
```

### Admin: Approve Entry

```ts
const { data, error } = await authClient.waitlist.approve({
  email: 'user@example.com',
});
```

### Admin: Reject Entry

```ts
const { data, error } = await authClient.waitlist.reject({
  email: 'user@example.com',
});
```

## Schema

The plugin adds a `waitlistEntry` table with the following fields:

| Field       | Type    | Description                           |
| ----------- | ------- | ------------------------------------- |
| `id`        | string  | Unique identifier                     |
| `email`     | string  | User's email (unique)                 |
| `status`    | string  | `pending` \| `approved` \| `rejected` |
| `position`  | number  | Position in queue                     |
| `userId`    | string? | Optional relation to user             |
| `createdAt` | date    | Timestamp                             |

## API Endpoints

| Method | Endpoint             | Auth    | Description   |
| ------ | -------------------- | ------- | ------------- |
| POST   | `/waitlist/join`     | None    | Join waitlist |
| GET    | `/waitlist/status`   | None    | Check status  |
| GET    | `/waitlist/position` | None    | Get position  |
| GET    | `/waitlist/list`     | Session | List entries  |
| POST   | `/waitlist/approve`  | Session | Approve entry |
| POST   | `/waitlist/reject`   | Session | Reject entry  |

## TypeScript

The plugin provides full TypeScript support. Types are automatically inferred when using the client:

```ts
// Full type inference
const result = await authClient.waitlist.join({
  email: 'test@example.com',
});

// result.data is typed as WaitlistEntry
// result.error is typed as { message: string }
```

## License

MIT
