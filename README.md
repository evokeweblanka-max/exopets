# EXOPETS Colombo

Public website, owner content studio and moderated multi-seller marketplace for EXOPETS Colombo.

## Main routes

- `/` — public website and live-parrot catalogue
- `/shop` — house and approved seller products
- `/seller` — seller registration, login, profile and product dashboard
- `/admin` — owner content studio, seller approvals and product moderation

## Architecture

- Vercel hosts the static website and serverless admin endpoints.
- Supabase provides seller authentication, row-level secured data and product image storage.
- Vercel Blob retains the existing owner-managed website content and customer requests.
- Seller images are normalized in the browser to a 1200 × 900 WebP canvas with contained positioning before upload.

## Security model

- Every seller can access only their own private profile, drafts and uploads.
- Public visitors can read only active products belonging to approved sellers.
- Seller and product approvals require a verified Supabase user whose server-controlled profile role is `admin`.
- All public-schema marketplace tables use Row Level Security.

## Database

The reproducible Supabase SQL lives in `supabase/migrations/`. Apply migrations in numeric order.

## Local checks

```bash
npm install
npm run check
```
