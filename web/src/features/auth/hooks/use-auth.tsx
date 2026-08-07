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
import { isAdminEmail } from "@/lib/admin/emails";
import { auth, isFirebaseConfigured } from "@/lib/firebase/client";
import {
  signInOwner,
  signInWithGoogle,
  signOutOwner,
  signUpOwner,
} from "@/lib/firebase/auth";
import { getUserProfile } from "@/lib/firebase/users";
import type { LoginInput, SignupInput } from "@/lib/validators/forms";
import type { UserProfile } from "@/types";

type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  configured: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (input: LoginInput) => Promise<void>;
  signUp: (input: SignupInput) => Promise<void>;
  signInGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const configured = isFirebaseConfigured();

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const next = await getUserProfile(user.uid);
      setProfile(next);
    } catch {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (!auth) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      queueMicrotask(() => setProfile(null));
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load Firestore profile when auth user changes
    void refreshProfile();
  }, [user, refreshProfile]);

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
    setProfile(null);
  }, []);

  const isAdmin =
    Boolean(profile?.role === "admin") || isAdminEmail(user?.email);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      configured,
      isAdmin,
      refreshProfile,
      signIn,
      signUp,
      signInGoogle,
      signOut,
    }),
    [
      user,
      profile,
      loading,
      configured,
      isAdmin,
      refreshProfile,
      signIn,
      signUp,
      signInGoogle,
      signOut,
    ],
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
