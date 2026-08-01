# Firestore rules (must publish on the ACTIVE project)

Your app currently uses project: **my-book-menu-first**

Important: `.env.local` overrides `.env`. Keep both in sync after changing credentials.

## Publish rules now

1. Open Firebase Console for **my-book-menu-first**
2. **Build → Firestore Database → Rules**
3. Paste contents of `firestore.rules`
4. Click **Publish**
5. Restart `npm run dev` and hard-refresh the public menu

Guest menus need public read on `restaurants`, `categories`, and `menuItems`.
