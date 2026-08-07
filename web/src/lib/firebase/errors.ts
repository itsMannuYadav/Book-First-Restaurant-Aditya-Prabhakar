import { FirebaseError } from "firebase/app";

export function getFirebaseErrorMessage(error: unknown): string {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/weak-password":
        return "Password is too weak. Use at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Pop-up blocked. Allow pop-ups for this site and try again.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      case "auth/operation-not-allowed":
        return "This sign-in method is not enabled in Firebase Console yet.";
      case "auth/configuration-not-found":
        return "Firebase Authentication is not set up for this project yet. In Firebase Console open Authentication → Get started, then enable Email/Password and Google. Restart npm run dev after that.";
      case "permission-denied":
        return "Permission denied by Firestore. If you just changed rules, wait ~30s and retry. If this is Confirm/Decline on an order, re-publish the latest web/firestore.rules (order update rules were tightened by mistake earlier). Also make sure you’re still signed in as the restaurant owner.";
      case "failed-precondition":
        return "Firestore needs an index for this query. Open the error link in the browser console to create it, then retry.";
      case "storage/unauthorized":
        return "You don’t have permission to upload images. Make sure you’re signed in and Storage rules allow restaurant uploads.";
      case "storage/canceled":
        return "Upload was cancelled.";
      case "storage/retry-limit-exceeded":
        return "Upload failed after several retries. Check your connection and try again.";
      case "storage/invalid-format":
      case "storage/invalid-argument":
        return "That image couldn’t be uploaded. Try a different JPG or PNG.";
      case "storage/unknown":
      case "storage/quota-exceeded":
      case "storage/server-file-wrong-size":
        return "Logo upload isn’t available right now. Image storage is still being set up — please try again later.";
      default:
        if (error.code.startsWith("storage/")) {
          return "Logo upload isn’t available right now. Image storage is still being set up — please try again later.";
        }
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
