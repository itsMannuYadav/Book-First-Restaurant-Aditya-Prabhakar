import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { requireFirebaseStorage } from "@/lib/firebase/require";

const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFor(type: string): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

export function validateRestaurantImage(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return "Use a JPG, PNG, WebP, or GIF image.";
  }
  if (file.size > MAX_LOGO_BYTES) {
    return "Image must be 2 MB or smaller.";
  }
  return null;
}

/** Upload restaurant logo to Firebase Storage and return the public download URL. */
export async function uploadRestaurantLogo(
  restaurantId: string,
  file: File,
): Promise<string> {
  const validationError = validateRestaurantImage(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const { storage } = requireFirebaseStorage();
  const path = `restaurants/${restaurantId}/logo.${extensionFor(file.type)}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, {
    contentType: file.type,
    cacheControl: "public,max-age=3600",
  });
  return getDownloadURL(storageRef);
}

/** Best-effort delete of previous logo files (ignores missing objects). */
export async function deleteRestaurantLogo(
  restaurantId: string,
): Promise<void> {
  try {
    const { storage } = requireFirebaseStorage();
    for (const ext of ["jpg", "png", "webp", "gif"] as const) {
      try {
        await deleteObject(
          ref(storage, `restaurants/${restaurantId}/logo.${ext}`),
        );
      } catch {
        // ignore missing
      }
    }
  } catch {
    // ignore — clearing the Firestore field is enough for the UI
  }
}
