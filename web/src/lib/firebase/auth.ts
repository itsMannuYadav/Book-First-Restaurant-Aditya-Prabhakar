import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { isAdminEmail } from "@/lib/admin/emails";
import { requireFirebase } from "@/lib/firebase/require";
import {
  createRestaurant,
  getRestaurantByOwnerId,
} from "@/lib/firebase/restaurants";
import { seedStarterMenu } from "@/lib/firebase/seed-menu";
import { ensureUserProfile, getUserProfile } from "@/lib/firebase/users";
import type { SignupInput, LoginInput } from "@/lib/validators/forms";

async function ensureAdminWorkspace(user: User) {
  const displayName =
    user.displayName || user.email?.split("@")[0] || "Admin";
  await ensureUserProfile({
    uid: user.uid,
    email: user.email ?? "",
    displayName,
    role: "admin",
    accountStatus: "active",
  });
}

async function ensureOwnerWorkspace(user: User, restaurantName?: string) {
  const existingProfile = await getUserProfile(user.uid);
  const isBrandNew = !existingProfile;
  const displayName =
    restaurantName?.trim() ||
    user.displayName ||
    existingProfile?.displayName ||
    user.email?.split("@")[0] ||
    "My Restaurant";

  await ensureUserProfile({
    uid: user.uid,
    email: user.email ?? "",
    displayName,
    role: "owner",
    accountStatus: isBrandNew ? "pending" : "active",
  });

  let restaurant = await getRestaurantByOwnerId(user.uid);
  if (!restaurant) {
    restaurant = await createRestaurant({
      ownerId: user.uid,
      name: displayName,
      approvalStatus: isBrandNew ? "pending" : "approved",
    });
  } else {
    try {
      await seedStarterMenu(restaurant.id);
    } catch {
      // Ignore seed failures for existing accounts.
    }
  }
}

async function ensureWorkspace(user: User, restaurantName?: string) {
  if (isAdminEmail(user.email)) {
    await ensureAdminWorkspace(user);
    return;
  }
  await ensureOwnerWorkspace(user, restaurantName);
}

export async function signUpOwner(input: SignupInput): Promise<User> {
  const { auth } = requireFirebase();

  if (isAdminEmail(input.email)) {
    throw new Error(
      "This email is reserved for the team console. Sign in instead of creating an owner account.",
    );
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  );

  await updateProfile(credential.user, {
    displayName: input.restaurantName,
  });

  await ensureWorkspace(credential.user, input.restaurantName);
  return credential.user;
}

export async function signInOwner(input: LoginInput): Promise<User> {
  const { auth } = requireFirebase();
  const credential = await signInWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  );
  await ensureWorkspace(credential.user);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const { auth } = requireFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  await ensureWorkspace(credential.user);
  return credential.user;
}

export async function signOutOwner(): Promise<void> {
  const { auth } = requireFirebase();
  await signOut(auth);
}
