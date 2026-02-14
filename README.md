# Better Waitlist

[![npm version](https://img.shields.io/npm/v/better-waitlist)](https://www.npmjs.com/package/better-waitlist)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/haxurn/better-waitlist)
[![Better Auth](https://img.shields.io/badge/Better_Auth-Plugin-blue)](https://better-auth.com)
[![GitHub Stars](https://img.shields.io/github/stars/haxurn/better-waitlist?style=social)](https://github.com/haxurn/better-waitlist/stargazers)
[![Stars Over Time](https://starchart.cc/haxurn/better-waitlist.svg)](https://starchart.cc/haxurn/better-waitlist)

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
      // Authentication
      requireAdmin: true, // require session for admin endpoints (default: true)

      // Entry Management
      maxEntries: 0, // maximum entries allowed (0 = unlimited, default: 0)
      enabled: true, // allow new waitlist joins (default: true)

      // Public Features
      allowStatusCheck: true, // allow public status checks (default: true)
      showPosition: false, // show position in status response (default: false)

      // Invitations
      sendInviteOnApprove: false, // auto-send invite when approving (default: false)

      // Callbacks
      onJoin: async (entry) => {
        // Called when user joins waitlist
        console.log('New entry:', entry.email);
      },
      onApprove: async (entry) => {
        // Called when entry is approved
        console.log('Approved:', entry.email);
      },
      onReject: async (entry) => {
        // Called when entry is rejected
        console.log('Rejected:', entry.email);
      },
      onSignUp: async (entry) => {
        // Called when entry is removed (user signed up)
        console.log('Signed up:', entry.email);
      },
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

### Admin: Get Stats

```ts
const { data, error } = await authClient.waitlist.stats();

if (data) {
  console.log(data.total);
  console.log(data.pending);
  console.log(data.approved);
  console.log(data.rejected);
}
```

### Admin: Approve Entry

```ts
const { data, error } = await authClient.waitlist.approve({
  email: 'user@example.com',
});

// With auto-send invite
const { data: data2 } = await authClient.waitlist.approve({
  email: 'user@example.com',
  sendInvite: true, // override plugin setting for this call
});
```

### Admin: Reject Entry

```ts
const { data, error } = await authClient.waitlist.reject({
  email: 'user@example.com',
});
```

### Admin: Promote Entry

Send an invite to an approved user:

```ts
const { data, error } = await authClient.waitlist.promote({
  email: 'user@example.com',
});
```

### Admin: Promote All

Send invites to all approved users:

```ts
const { data, error } = await authClient.waitlist.promoteAll({
  status: 'approved', // or 'pending' - default: 'approved'
});

if (data) {
  console.log(data.promoted); // count of promoted entries
}
```

### Admin: Remove Entry

Remove an entry from the waitlist (e.g., after user signs up):

```ts
const { data, error } = await authClient.waitlist.remove({
  email: 'user@example.com',
});

if (data) {
  console.log(data.entry); // the removed entry data
}
```

## Schema

The plugin adds a `waitlist` table with the following fields:

| Field        | Type     | Description                           |
| ------------ | -------- | ------------------------------------- |
| `id`         | string   | Unique identifier                     |
| `email`      | string   | User's email (unique)                  |
| `status`     | string   | `pending` \| `approved` \| `rejected` |
| `position`   | number   | Position in queue                     |
| `userId`     | string?  | Optional relation to user             |
| `invitedAt`  | date?    | Timestamp when invite was sent        |
| `createdAt`  | date     | Timestamp when joined                 |

## API Endpoints

| Method | Endpoint               | Auth    | Description               |
| ------ | ---------------------- | ------- | ------------------------- |
| POST   | `/waitlist/join`      | None    | Join waitlist            |
| GET    | `/waitlist/status`    | None    | Check status             |
| GET    | `/waitlist/position` | None    | Get position             |
| GET    | `/waitlist/list`      | Session | List entries             |
| GET    | `/waitlist/stats`     | Session | Get waitlist statistics  |
| POST   | `/waitlist/approve`   | Session | Approve entry            |
| POST   | `/waitlist/reject`    | Session | Reject entry             |
| POST   | `/waitlist/promote`   | Session | Send invite to user      |
| POST   | `/waitlist/promote-all` | Session | Send invites to all      |
| POST   | `/waitlist/remove`    | Session | Remove entry             |

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

## Contributing

Contributions are welcome! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Code of Conduct

Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) before participating in our community.
