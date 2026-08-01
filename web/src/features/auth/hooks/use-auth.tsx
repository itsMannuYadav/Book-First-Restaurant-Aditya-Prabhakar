"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  signInOwner,
  signInWithGoogle,
  signOutOwner,
  signUpOwner,
} from "@/lib/firebase/auth";
import type { LoginInput, SignupInput } from "@/lib/validators/forms";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: SignupInput) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (input: LoginInput) => {
    await signInOwner(input);
  }, []);

  const signUp = useCallback(async (input: SignupInput) => {
    await signUpOwner(input);
  }, []);

  const signInGoogle = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signOut = useCallback(async () => {
    await signOutOwner();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      signIn,
      signUp,
      signInGoogle,
      signOut,
    }),
    [user, loading, configured, signIn, signUp, signInGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
