import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { User, UserPreferences, UserSession } from "~/server/db/schema";
import { authKeys } from "./use-auth";

export function useSeenUsers() {
  return useQuery({
    queryKey: authKeys.seenUsers(),
    queryFn: async (): Promise<User[]> => {
      const response = await fetch("/api/users/seen");
      if (!response.ok) {
        throw new Error("Failed to fetch seen users");
      }
      return (await response.json()) as User[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserPreferences(did: string) {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: [...authKeys.user(did), "preferences"],
    queryFn: async (): Promise<UserPreferences> => {
      const response = await fetch(
        `/api/users/${encodeURIComponent(did)}/preferences`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user preferences");
      }
      return (await response.json()) as UserPreferences;
    },
    enabled: !!did,
  });

  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const response = await fetch(
        `/api/users/${encodeURIComponent(did)}/preferences`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newPreferences),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update preferences");
      }

      return (await response.json()) as UserPreferences;
    },
    onMutate: async (newPreferences) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [...authKeys.user(did), "preferences"],
      });

      // Snapshot previous value
      const previousPreferences = queryClient.getQueryData([
        ...authKeys.user(did),
        "preferences",
      ]);

      // Optimistically update
      queryClient.setQueryData(
        [...authKeys.user(did), "preferences"],
        (old: UserPreferences) => ({ ...old, ...newPreferences }),
      );

      return { previousPreferences };
    },
    onError: (err, newPreferences, context) => {
      // Rollback on error
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          [...authKeys.user(did), "preferences"],
          context.previousPreferences,
        );
      }
    },
    onSettled: () => {
      // Refetch after mutation
      void queryClient.invalidateQueries({
        queryKey: [...authKeys.user(did), "preferences"],
      });
    },
  });

  return {
    preferences,
    isLoading,
    updatePreferences: updatePreferences.mutate,
    isUpdating: updatePreferences.isPending,
    updateError: updatePreferences.error,
  };
}

export function useUserSessions(did: string) {
  return useQuery({
    queryKey: [...authKeys.user(did), "sessions"],
    queryFn: async (): Promise<UserSession[]> => {
      const response = await fetch(
        `/api/users/${encodeURIComponent(did)}/sessions`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user sessions");
      }
      return (await response.json()) as UserSession[];
    },
    enabled: !!did,
  });
}
