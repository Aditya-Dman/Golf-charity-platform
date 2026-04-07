# Golf Charity Subscription Platform

**Main website:** **[golf-charity-platform-3litbqtig-adityadhiman-projects.vercel.app](https://golf-charity-platform-3litbqtig-adityadhiman-projects.vercel.app/)**

Full-stack web application built for the Digital Heroes PRD assignment.

## Features

- Public visitor pages: concept + charity directory + call-to-action
- Authentication: signup/login with Supabase
- Subscription system: monthly/yearly plan, charity selection, charity percentage
- Score management: Stableford score input with automatic rolling latest-5 retention
- Draw engine:
  - Random and weighted modes
  - Simulation and publish flows
  - Tier logic (5/4/3) with 40/35/25 split
  - Jackpot rollover when no 5-match winner
- User dashboard:
  - Subscription status
  - Score entry and reverse-chronological score list
  - Participation/winnings view
  - Winner proof URL submission
- Admin dashboard:
  - Analytics overview
  - Draw run/publish controls
  - Charity management (create)
  - Winner verification and payout status updates

## Tech Stack

- Next.js 16 (App Router, TypeScript)
- Supabase (Auth + Postgres + RLS)
- Tailwind CSS
- Zod validation

## Project Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and add values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
MONTHLY_PLAN_PRICE=29
YEARLY_PLAN_PRICE=299
```

3. In Supabase SQL Editor, run:

- `supabase/schema.sql`

4. Start app:

```bash
npm run dev
```

## Admin Bootstrap

To make your first account admin:

1. Sign up in the app.
2. Send a POST request to `/api/auth/set-role` while logged in.
3. Add header `x-admin-bootstrap` with your `SUPABASE_SERVICE_ROLE_KEY` value.

After this, your current user gets `admin` role and can access `/admin`.

## Important API Routes

- `POST /api/subscription`
- `POST /api/scores`
- `POST /api/admin/draw/run`
- `POST /api/admin/charities`
- `PATCH /api/admin/winners/:id`
- `PATCH /api/winners/:id/proof`

## Production Validation

```bash
npm run lint
npm run build
```

## Deployment (New Accounts Required)

1. Create a new Supabase project.
2. Run `supabase/schema.sql` in the new project.
3. Create a new Vercel account and import this repository.
4. Add all environment variables from `.env.example` to Vercel project settings.
5. Deploy.
6. Verify these flows on the live URL:
   - Signup/login
   - Subscription setup (monthly/yearly)
   - Add >5 scores and confirm rolling retention
   - Simulate and publish draw from admin
   - Update winner verification/payment status

## Notes

- Stripe keys are included in env structure for payment integration readiness.
- The current assignment build models subscription activation directly in app logic and database state.
