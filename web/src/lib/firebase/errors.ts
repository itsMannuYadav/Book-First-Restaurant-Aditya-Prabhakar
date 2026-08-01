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
        return "Permission denied. Open Firebase Console → Firestore → Rules, paste web/firestore.rules, click Publish, wait 30 seconds, then try again.";
      case "failed-precondition":
        return "Firestore needs an index for this query. Open the error link in the browser console to create it, then retry.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
