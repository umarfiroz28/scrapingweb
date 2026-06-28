# Cash For Old AC & Battery

Premium mobile-first lead generation website for buying old ACs and batteries in Delhi NCR.

## Features

- Bright React + TypeScript + Tailwind landing page
- Short high-conversion lead form
- Phone links for `7310886906` and `8802227860`
- Floating WhatsApp CTA to `https://wa.me/918802227860`
- Supabase lead storage and optional image upload
- Supabase Edge Function for Telegram and email notifications
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

Deploy the Edge Function:

```bash
supabase functions deploy notify-lead
```

Set function secrets:

```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_token
supabase secrets set TELEGRAM_CHAT_ID=your_chat_id
supabase secrets set NOTIFICATION_EMAIL=owner@example.com
supabase secrets set RESEND_API_KEY=your_resend_key
```

Telegram and email are sent independently. If one fails, the other still runs, and the result is saved to `telegram_status` and `email_status`.

## Deployment

Build the frontend:

```bash
npm run build
```

Deploy the `dist` folder to Vercel, Netlify, Cloudflare Pages, or any static host. Add the same `VITE_*` environment variables in the hosting dashboard before building.
