export type OrderStatus =
  | "pending"
  | "confirmed"
  | "declined"
  | "ready"
  | "completed"
  | "cancelled";

export interface OrderLineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface OrderGuestLocation {
  lat: number;
  lng: number;
  accuracyMeters: number;
  distanceMeters: number;
}

export interface OrderStatusEvent {
  status: OrderStatus;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  shortCode: string;
  tableId: string;
  tableLabel: string;
  items: OrderLineItem[];
  currency: string;
  total: number;
  status: OrderStatus;
  guestNote?: string;
  ownerNote?: string;
  /** Present when GPS was required/captured at order time. */
  guestLocation?: OrderGuestLocation;
  /** SHA-256 hex of the guest access token — never expose to clients. */
  accessTokenHash: string;
  clientIdempotencyKey: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderStatusEvent[];
}

/** Safe fields returned to the guest via the status API. */
export interface GuestOrderView {
  id: string;
  shortCode: string;
  tableLabel: string;
  items: OrderLineItem[];
  currency: string;
  total: number;
  status: OrderStatus;
  guestNote?: string;
  ownerNote?: string;
  createdAt: string;
  updatedAt: string;
}

/** Owner-facing order (no token hash). */
export interface OwnerOrderView {
  id: string;
  restaurantId: string;
  shortCode: string;
  tableId: string;
  tableLabel: string;
  items: OrderLineItem[];
  currency: string;
  total: number;
  status: OrderStatus;
  guestNote?: string;
  ownerNote?: string;
  guestLocation?: OrderGuestLocation;
  createdAt: string;
  updatedAt: string;
  statusHistory: OrderStatusEvent[];
}
