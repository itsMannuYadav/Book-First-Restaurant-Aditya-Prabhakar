export type MenuThemeId = "dark" | "rustic" | "minimal";

export type DietTag = "veg" | "non-veg" | "vegan" | "gf";

export type DietFilter =
  | "all"
  | "veg"
  | "non-veg"
  | "vegan"
  | "gf"
  | "chef";

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  tags?: DietTag[];
  badge?: string;
  imageUrl?: string;
  isAvailable?: boolean;
  sortOrder?: number;
}

export interface MenuCategory {
  id?: string;
  name: string;
  icon?: string;
  description?: string;
  sortOrder?: number;
  items: MenuItem[];
}

export interface RestaurantPublicProfile {
  name: string;
  slug: string;
  tagline?: string;
  logoUrl?: string;
  coverUrl?: string;
  rating?: string;
  address?: string;
  timing?: string;
  phone?: string;
  currency: string;
  theme: MenuThemeId;
}

/** Shape consumed by the public menu experience */
export interface PublicMenuData {
  restaurant: RestaurantPublicProfile;
  categories: MenuCategory[];
}

/** Legacy reference JSON shape (demo data) */
export interface DemoMenuJson {
  restaurant: string;
  tagline?: string;
  theme?: string;
  currency?: string;
  rating?: string;
  address?: string;
  timing?: string;
  categories: Array<{
    name: string;
    icon?: string;
    description?: string;
    items: MenuItem[];
  }>;
}
