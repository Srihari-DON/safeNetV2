# SafeNet MVP v2

A fresh MVP focused on three working products:

1. Moderator onboarding portal
2. Moderator decision portal
3. AI moderation-instruction API for company AI pipelines

## Stack

- Next.js App Router (TypeScript)
- Prisma ORM
- Supabase PostgreSQL
- Vercel deployment

## Local Setup

1. Install dependencies:
	npm install

2. Create env file:
	copy .env.example .env

3. Set DATABASE_URL and DIRECT_URL from Supabase.
	- Use pooled URI for DATABASE_URL (port 6543)
	- Use direct URI for DIRECT_URL (db.PROJECT_REF.supabase.co:5432)
	- URL-encode password special characters

4. Generate Prisma client:
	npm run prisma:generate

5. Run migrations:
	npm run prisma:migrate

6. Seed data:
	npm run seed

7. Start app:
	npm run dev

## Main Routes

- /onboarding: register moderators
- /portal: moderation queue and decisions
- /admin: admin metrics dashboard
- /ai-lab: test AI instructions endpoint

## API Endpoints

- POST /api/moderators/register
- GET /api/moderators
- GET /api/moderation/queue
- POST /api/moderation/review
- GET /api/admin/overview
- POST /api/ai/instructions

## Deploy to Vercel

1. Push project to GitHub.
2. Import repository into Vercel.
3. Add env vars in Vercel:
	- DATABASE_URL
	- DIRECT_URL
4. Redeploy.

## Verification Commands

- npm run db:check
- npm run build

If db:check fails with P1001, your DATABASE_URL host or port is wrong.
