# polar-nextjs

Payments and Checkouts made dead simple with Next.js.

## Checkout

Create a Checkout handler which takes care of redirections.

```typescript
// checkout/route.ts
import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
	accessToken: process.env.POLAR_ACCESS_TOKEN,
	successUrl: process.env.SUCCESS_URL,
});
```

## Webhooks

A simple utility which resolves incoming webhook payloads by signing the webhook secret properly.