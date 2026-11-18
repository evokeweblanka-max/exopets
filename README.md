# EXOPETS Colombo

Owner-operated live-parrot and bird-care catalogue for EXOPETS Colombo.

## Main routes

- `/` — public website and live-parrot catalogue
- `/shop` — owner-managed bird-care products with WhatsApp enquiries
- `/care-guides` — practical species care information
- `/dna-testing` — DNA-test request form
- `/admin` — private owner content studio

## Owner workflow

The owner signs in at `/admin` to manage business details, birds, availability, products, prices, images, care guides, bird-matcher questions and customer enquiries. Uploaded images are converted in the browser to a consistent 1400 × 1050 WebP frame before secure storage.

## Architecture

- Vercel hosts the static website and serverless API routes.
- Vercel Blob stores website content, enquiries and owner-uploaded images.
- Admin sessions use a signed, HTTP-only, secure cookie.
- Public visitors cannot edit content and do not have accounts.

## Required environment variables

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `BLOB_READ_WRITE_TOKEN`

## Local checks

```bash
npm install
npm run check
```
