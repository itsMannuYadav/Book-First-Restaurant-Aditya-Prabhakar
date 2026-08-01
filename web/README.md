# BookFirst

Premium digital menu SaaS for restaurants.

Restaurant owners create a profile, manage their menu, pick a theme, and share a QR code. Guests scan and browse — no login.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Firebase (Auth, Firestore, Storage) — client stubs ready

## Getting started

```bash
cd web
npm install
cp .env.example .env.local   # or use your existing .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Firebase Console (required once)

1. Enable **Authentication → Email/Password**
2. Create a **Firestore** database (start in production mode, then paste rules)
3. Deploy rules from `firestore.rules` (Firebase Console → Firestore → Rules)
4. Optional: Storage rules from `storage.rules`
5. Restart `npm run dev` after any `.env` change

Sample public menu: `/m/cafe-aroma`  
Your restaurant menu: `/m/{your-slug}` after signup + publish

## Architecture

```
src/
  app/                  # routes (marketing, auth, dashboard, public menu)
  components/           # shared + shadcn ui
  features/             # feature modules (auth, menu-public, restaurant, …)
  lib/firebase/         # Auth, restaurants, categories, menu items
  types/                # shared TypeScript models
  constants/            # brand, routes, theme options
  data/                 # demo menu JSON fallback
```

## Current status

1. **Done** — Auth, restaurant profile, categories, menu items, themes, QR, public menu from Firestore
2. **Next** — image uploads (Storage), richer empty states, polish