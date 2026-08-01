import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { requireFirebase } from "@/lib/firebase/require";
import { COLLECTIONS } from "@/lib/firebase/collections";
import {
  createRestaurant,
  getRestaurantByOwnerId,
} from "@/lib/firebase/restaurants";
import { seedStarterMenu } from "@/lib/firebase/seed-menu";
import { nowIso } from "@/lib/utils/string";
import type { SignupInput, LoginInput } from "@/lib/validators/forms";

async function ensureOwnerWorkspace(user: User, restaurantName?: string) {
  const { db } = requireFirebase();
  const userRef = doc(db, COLLECTIONS.users, user.uid);
  const existingUser = await getDoc(userRef);
  const timestamp = nowIso();
  const displayName =
    restaurantName?.trim() ||
    user.displayName ||
    user.email?.split("@")[0] ||
    "My Restaurant";

  if (!existingUser.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email ?? "",
      displayName,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  let restaurant = await getRestaurantByOwnerId(user.uid);
  if (!restaurant) {
    restaurant = await createRestaurant({
      ownerId: user.uid,
      name: displayName,
    });
  } else {
    try {
      await seedStarterMenu(restaurant.id);
    } catch {
      // Ignore seed failures for existing accounts.
    }
  }
}

export async function signUpOwner(input: SignupInput): Promise<User> {
  const { auth } = requireFirebase();

  const credential = await createUserWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  );

  await updateProfile(credential.user, {
    displayName: input.restaurantName,
  });

  await ensureOwnerWorkspace(credential.user, input.restaurantName);
  return credential.user;
}

export async function signInOwner(input: LoginInput): Promise<User> {
  const { auth } = requireFirebase();
  const credential = await signInWithEmailAndPassword(
    auth,
    input.email,
    input.password,
  );
  await ensureOwnerWorkspace(credential.user);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const { auth } = requireFirebase();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  const credential = await signInWithPopup(auth, provider);
  await ensureOwnerWorkspace(credential.user);
  return credential.user;
}

export async function signOutOwner(): Promise<void> {
  const { auth } = requireFirebase();
  await signOut(auth);
}
