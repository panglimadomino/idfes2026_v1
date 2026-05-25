# IDFES 2026 Web

Frontend Next.js untuk portal IDFES 2026.

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase Setup

1. Copy env template:

```bash
copy .env.local.example .env.local
```

2. Isi nilai dari dashboard Supabase (`Project Settings > API`):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Catatan:

- `SUPABASE_SERVICE_ROLE_KEY` hanya untuk server-side, jangan dipakai di client.
- File `.env.local` tidak boleh di-commit.

## Build

```bash
npm run build
```

## Admin Login

- URL login: `/login`
- URL dashboard: `/admin`
- User admin dibuat di Supabase Auth, lalu assign role dengan SQL:

```sql
select public.assign_super_admin_by_email('email-admin@domain.com');
```

## Deploy Vercel

Pastikan environment variable di Vercel terisi:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
