import type { MenuThemeId } from "./menu";

export type RestaurantStatus = "draft" | "published" | "archived";

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
