import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { getNymeriaAuth, type EnhancedSession } from "~/lib/auth/client";
import type { User } from "~/server/db/schema";

// Use the database User type directly instead of duplicating
export type AuthUser = User;

// Query keys
export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
  user: (did: string) => [...authKeys.all, "user", did] as const,
  users: () => [...authKeys.all, "users"] as const,
  seenUsers: () => [...authKeys.all, "seen-users"] as const,
};

// Main auth hook
export function useAuth() {
  // Initialize currentDid from localStorage immediately
  const [currentDid, setCurrentDid] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("nymeria-current-did");
      console.log(
        "🔍 useAuth: Initializing currentDid from localStorage:",
        stored,
      );
      return stored;
    }
    return null;
  });

  // Debug current DID changes and persist to localStorage
  useEffect(() => {
    // Reduce noise in development by only logging meaningful changes
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 useAuth: currentDid changed to:", currentDid);
    }

    // Persist current DID to localStorage
    if (currentDid) {
      localStorage.setItem("nymeria-current-did", currentDid);
    } else {
      localStorage.removeItem("nymeria-current-did");
    }
  }, [currentDid]);
  const queryClient = useQueryClient();
  const router = useRouter();

  // Get current session
  const {
    data: session,
    isLoading: isSessionLoading,
    error: sessionError,
  } = useQuery({
    queryKey: [...authKeys.session(), currentDid],
    queryFn: async (): Promise<EnhancedSession | null> => {
      if (!currentDid) return null;
      return await getNymeriaAuth().restoreSession(currentDid);
    },
    enabled: !!currentDid,
    staleTime: 5 * 60 * 1000, // 5 minutes - longer for session data
    gcTime: 10 * 60 * 1000, // 10 minutes garbage collection
    retry: 1, // Reduce retries for auth failures
    refetchOnWindowFocus: false, // Don't refetch on window focus for auth
  });

  // Get user data from database
  const {
    data: user,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery({
    queryKey: authKeys.user(session?.sub ?? ""),
    queryFn: async (): Promise<AuthUser | null> => {
      if (!session?.sub) return null;

      const response = await fetch(
        `/api/users/${encodeURIComponent(session.sub)}`,
      );
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch user data");
      }
      return (await response.json()) as AuthUser;
    },
    enabled: !!session?.sub,
  });

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({
      ident,
      redirect,
    }: {
      ident: string;
      redirect?: string;
    }) => {
      await getNymeriaAuth().signIn(ident, redirect);
    },
    onError: (error) => {
      console.error("Sign in failed:", error);
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async (did: string) => {
      await getNymeriaAuth().signOut(did);
    },
    onSuccess: () => {
      setCurrentDid(null);
      queryClient.clear();
      router.push("/");
    },
  });

  // Handle OAuth callback
  const handleCallback = useCallback(async () => {
    try {
      console.log("🔄 useAuth: Starting callback handling...");
      const session = await getNymeriaAuth().handleCallback();

      if (session) {
        console.log(
          "✅ useAuth: Session received, setting current DID:",
          session.sub,
        );
        setCurrentDid(session.sub);

        // Invalidate queries to refetch with new session
        await queryClient.invalidateQueries({ queryKey: authKeys.all });
        console.log("✅ useAuth: Queries invalidated, callback complete");

        return session;
      } else {
        console.warn("⚠️ useAuth: No session returned from handleCallback");
      }
    } catch (error) {
      console.error("❌ useAuth: Callback handling failed:", error);
    }
    return null;
  }, [queryClient]);

  // No additional initialization needed - currentDid is initialized from localStorage in useState

  return {
    // State
    session,
    user,
    isAuthenticated: !!session && !!user,
    isLoading: isSessionLoading || isUserLoading,
    error: sessionError ?? userError,

    // Actions
    signIn: signInMutation.mutate,
    signOut: signOutMutation.mutate,
    handleCallback,

    // Mutation states
    isSigningIn: signInMutation.isPending,
    isSigningOut: signOutMutation.isPending,
    signInError: signInMutation.error,
    signOutError: signOutMutation.error,
  };
}
