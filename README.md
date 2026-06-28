# ScrappingWallah

Premium mobile-first lead generation website for buying scrap from the doorstep in Delhi NCR.

## Features

- Bright React + TypeScript + Tailwind landing page
- Short high-conversion lead form
- Phone links for `7310886906` and `8802227860`
- Floating WhatsApp CTA to `https://wa.me/918802227860`
- Supabase lead storage and optional image upload
- Supabase Edge Function for Telegram and email notifications
- Netlify Function fallback for Telegram and email notifications
- Meta Pixel and Google Analytics lead conversion tracking
- SEO tags, Open Graph image, and local business schema

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Or use:
# VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_WHATSAPP_NUMBER=918802227860
VITE_GA_MEASUREMENT_ID=
VITE_META_PIXEL_ID=
```

3. Run locally:

```bash
npm run dev
```

## Supabase

Run the SQL migration in `supabase/migrations/202606280001_create_leads.sql`.

It creates:

- `public.leads`
- RLS insert policy for public lead creation
- `lead-images` public storage bucket
- Public upload policy for lead images

Deploy the Edge Function if you want Supabase to send notifications:

```bash
supabase functions deploy notify-lead
```

Set function secrets:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
supabase secrets set TELEGRAM_CHAT_ID=your_chat_id
supabase secrets set NOTIFICATION_EMAIL=owner@example.com
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set NOTIFICATION_EMAIL_FROM="ScrappingWallah <leads@yourdomain.com>"
```

Telegram and email are sent independently. If one fails, the other still runs, and the result is saved to `telegram_status` and `email_status`.

## Netlify notifications

If you deploy on Netlify, add these environment variables in Netlify:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
NOTIFICATION_EMAIL=
RESEND_API_KEY=
NOTIFICATION_EMAIL_FROM=
```

Telegram needs `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`. Netlify only exposes frontend variables when they start with `VITE_`; the Telegram token and chat ID must stay server-only without `VITE_`.

## Deployment

Build the frontend:

```bash
npm run build
```

Deploy the project to Netlify with build command `npm run build` and publish directory `dist`. Add the `VITE_*` variables before building, and add the server-only notification variables for `netlify/functions/notify-lead`.
