import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  restaurantName: z.string().min(2, "Restaurant name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const restaurantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Restaurant name needs at least 2 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Menu URL is required")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Menu URL can only use lowercase letters, numbers, and hyphens (example: cafe-aroma)",
    ),
  tagline: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  timing: z.string().optional(),
  currency: z.string().min(1, "Currency is required (example: ₹)"),
  theme: z.enum(["dark", "rustic", "minimal"]),
  status: z.enum(["draft", "published", "archived"]),
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  icon: z.string().optional(),
  description: z.string().optional(),
  isVisible: z.boolean(),
});

export const menuItemSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more"),
  badge: z.string().optional(),
  tags: z.array(z.string()),
  isAvailable: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type RestaurantInput = z.infer<typeof restaurantSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
