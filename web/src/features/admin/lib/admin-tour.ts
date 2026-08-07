export const ADMIN_TOUR_STORAGE_KEY = "bf-admin-tour-completed-v1";

export type AdminTourStep = {
  id: string;
  title: string;
  body: string;
  /** Optional nav highlight target */
  highlight?: "overview" | "approvals" | "restaurants" | "owners";
  tip?: string;
};

export const ADMIN_TOUR_STEPS: AdminTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the team console",
    body: "This is where your team helps restaurant owners — approve accounts, fix menus, and upload big menus in bulk. You don’t need to be technical to use it.",
    tip: "This short tour shows once. You can replay it anytime from “Take a tour”.",
  },
  {
    id: "overview",
    title: "Overview",
    body: "Your home base. See how many owners are waiting for approval, who’s suspended, and which restaurants were updated recently. Tap a restaurant to open it.",
    highlight: "overview",
  },
  {
    id: "approvals",
    title: "Approvals",
    body: "New owners start as pending. They can build a draft menu, but they can’t publish until someone on your team approves them here. Reject if the signup isn’t a real venue.",
    highlight: "approvals",
    tip: "Approve first — then they can go live.",
  },
  {
    id: "restaurants",
    title: "Restaurants",
    body: "Search any venue by name, menu URL, or owner email. Open a restaurant to edit its profile, force draft/archive, or jump into its menu.",
    highlight: "restaurants",
  },
  {
    id: "menu-csv",
    title: "Menu + CSV upload",
    body: "Inside a restaurant, open “Menu + CSV”. Add dishes one by one, or paste / upload a spreadsheet. Categories are created automatically from the CSV.",
    tip: "Use the template if you’re unsure about columns. Prefer Append unless you mean to replace a category.",
  },
  {
    id: "owners",
    title: "Owners",
    body: "See every owner account. Suspend someone who’s misusing the product (their public menu drops back to draft). Reinstate when they’re ready again.",
    highlight: "owners",
  },
  {
    id: "done",
    title: "You’re set",
    body: "Start with Approvals if anyone is waiting. For big menus, open the restaurant → Menu + CSV. Changes here use secure team tools — owners still manage their own day-to-day dashboard.",
    tip: "Need a refresher later? Use Take a tour in the sidebar.",
  },
];

export function adminTourStorageKey(uid: string) {
  return `${ADMIN_TOUR_STORAGE_KEY}:${uid}`;
}

export function hasCompletedAdminTour(uid: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(adminTourStorageKey(uid)) === "1";
  } catch {
    return true;
  }
}

export function markAdminTourCompleted(uid: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(adminTourStorageKey(uid), "1");
  } catch {
    // Ignore private-mode / quota errors — tour may show again.
  }
}

export function clearAdminTourCompleted(uid: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(adminTourStorageKey(uid));
  } catch {
    // ignore
  }
}
