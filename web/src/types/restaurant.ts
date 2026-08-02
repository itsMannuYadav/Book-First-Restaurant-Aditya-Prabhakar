import type { MenuThemeId } from "./menu";

export type RestaurantStatus = "draft" | "published" | "archived";

export interface RestaurantLocation {
  lat: number;
  lng: number;
}

export interface RestaurantTable {
  id: string;
  label: string;
  isActive: boolean;
}

export interface Restaurant {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  logoUrl?: string;
  coverUrl?: string;
  address?: string;
  phone?: string;
  timing?: string;
  currency: string;
  theme: MenuThemeId;
  status: RestaurantStatus;
  /** Venue pin — required before dine-in ordering can be enabled. */
  location?: RestaurantLocation;
  /** Allowed distance from venue pin (meters). Default 120. */
  orderGeoRadiusMeters: number;
  /**
   * When true (default), guests must be near the venue pin to order.
   * Owners can disable for indoor GPS issues — increases prank-order risk.
   */
  requireGuestGps: boolean;
  /** Master switch for guest Place order. */
  orderingEnabled: boolean;
  /** Owner-defined seats/tables guests must pick from. */
  tables: RestaurantTable[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  restaurantId: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItemRecord {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  tags: string[];
  badge?: string;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
