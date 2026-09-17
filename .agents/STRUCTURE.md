# Project Structure & Conventions

## App Structure

- `src/app/` uses the Next.js App Router.
- Root `layout.tsx` wraps the application with Lenis.
- `page.tsx` contains the marketing landing page.

### Protected Routes

Each protected section has its own server `layout.tsx` that executes:

```ts
await requireAuthenticatedUser();
```

Available protected sections:

- `/dashboard`
- `/issues`
- `/mails`
- `/agents`
- `/projects`

Authentication is implemented in `src/lib/auth.ts` using:

- Session cookie: `token`
- Prisma-backed session storage

The `/auth` layout automatically redirects authenticated users to `/dashboard`.

---

## Dashboard Architecture

Dashboard pages are client components (`"use client"`).

Every page is wrapped with:

```tsx
<DashLayout current="..." router={router} />
```

using `useRouter()`.

`DashLayout` loads the current user from:

```
GET /api/auth/me
```

to populate the sidebar.

---

## Authentication

### Components

- `src/components/pages/auth.tsx`
  - Sign in
  - Sign up

- `src/components/pages/recovery.tsx`
  - Password recovery
  - Email verification

### Authentication Flow

Sign in:

- Validates credentials only
- No MFA
- Blocks unverified accounts
- Redirects users to `/auth/verify-email`
- Creates a fixed 30-day session
- Sends a best-effort login notification email including:
  - IP
  - Device
  - UTC timestamp

Password recovery:

1. Request verification code
2. Reset password

Recovery codes:

- One-time use
- Expire after 10 minutes

Password resets revoke every active session after updating the password hash.

---

## Authentication API

Available routes:

- `/api/auth/signin`
- `/api/auth/signup`
- `/api/auth/verify-email`
- `/api/auth/resend-code`
- `/api/auth/forgot-password`
- `/api/auth/reset-password`
- `/api/auth/me`
- `/api/auth/logout`

Notes:

- `verify-2fa` has been removed.
- `AuthApiResponse` may include action links for blocked, unverified accounts.

---

## Server Authentication

Authentication helpers live in:

```
src/lib/auth.ts
```

Responsibilities include:

- scrypt password hashing
- Password verification
- Verification code management
- Session management
- Request origin parsing

API handlers use standard Next.js Route Handlers and always return:

```ts
NextResponse.json({
  message,
  ...
});
```

---

## AI Providers

Settings communicate with the private API:

- `GET /api/ai-providers`
- `PUT /api/ai-providers`
- `DELETE /api/ai-providers`

Security requirements:

- Credentials are encrypted using `AI_CREDENTIALS_ENCRYPTION_KEY`.
- Responses are private (`no-store`).
- Plaintext API keys must never be returned or logged.

Provider behavior:

- Internal `GPT` is displayed as **OpenAI**.
- OpenAI API keys are validated before storage.
- ChatGPT subscriptions, browser cookies, and ChatGPT internal tokens are **not** valid API credentials.

---

## Settings Architecture

`src/app/dashboard/settings/page.tsx` only:

- Loads the authenticated user
- Composes the settings sections
- Coordinates sidebar/session updates

Each settings section owns its own local state:

- Profile
- Password
- AI Providers
- Provider Cards
- Account Deletion

Shared components live in:

```
src/components/settings/
```

---

## Component Organization

```
src/components/
├── forms/auth/
├── layouts/
├── pages/
├── settings/
├── ui/
└── sidebar.tsx
```

Responsibilities:

- `ui/`
  - Reusable UI primitives
- `layouts/`
  - Dashboard and marketing layouts
- `forms/auth/`
  - Authentication forms
- `pages/`
  - Page-level components

---

## Types & Utilities

Types:

```
src/types/
```

Pure utilities:

```
src/utils/
```

Examples:

- `avatar-url.ts`
- `greeting.ts`

---

## UI Conventions

Border radius:

```
rounded-sm
```

Backgrounds:

- `bg-background-card`
- `bg-background-focus`

Text:

- `text-foreground-off`

Primary accent:

```
#000bde
```

Animations use:

```
tailwind-animations
```

Examples:

- `animate-fade-in-up`

Buttons use:

```
src/components/ui/button.tsx
```

Variants:

- `main`
- `secondary`
- `ghost`

---

## Placeholder Pages

The following sections currently render minimal shells:

- Issues
- Mails
- Agents
- Projects

Each consists of:

- `DashLayout`
- `Heading`

Dashboard/Home currently display hardcoded empty-state content.

---

## Client Events

Profile and avatar updates dispatch:

```ts
window.dispatchEvent(new Event("user-updated"));
```

The sidebar listens for this event and refreshes the authenticated user information.
