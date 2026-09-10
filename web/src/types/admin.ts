import type { RestaurantStatus } from "./restaurant";
import type { UserProfile } from "./user";

/** Owner row for the admin owners table — profile plus a restaurant summary. */
export interface AdminOwnerListItem extends UserProfile {
  restaurantCount: number;
  primaryRestaurant?: {
    id: string;
    name: string;
    slug: string;
    status: RestaurantStatus;
  };
}
