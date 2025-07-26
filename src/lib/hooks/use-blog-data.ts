import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { BlogMetadata } from "~/server/db/schema";

export const blogKeys = {
  all: ["blog"] as const,
  metadata: () => [...blogKeys.all, "metadata"] as const,
  metadataByAuthor: (authorDid: string) =>
    [...blogKeys.metadata(), authorDid] as const,
  metadataByEntry: (authorDid: string, rkey: string) =>
    [...blogKeys.metadataByAuthor(authorDid), rkey] as const,
  mentions: () => [...blogKeys.all, "mentions"] as const,
  mentionsByEntry: (entryUri: string) =>
    [...blogKeys.mentions(), entryUri] as const,
};

export function useBlogMetadata(authorDid: string, entryTitle?: string) {
  return useQuery({
    queryKey: [...blogKeys.metadataByAuthor(authorDid), { entryTitle }],
    queryFn: async (): Promise<BlogMetadata[]> => {
      const params = new URLSearchParams({ authorDid });
      if (entryTitle) {
        params.append("entryTitle", entryTitle);
      }

      const response = await fetch(`/api/blog/metadata?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch blog metadata");
      }
      return (await response.json()) as BlogMetadata[];
    },
    enabled: !!authorDid,
  });
}

export function useCreateBlogEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entry: {
      authorDid: string;
      rkey: string;
      entryTitle: string;
      cid: string;
      handle?: string;
      trackedPost?: string;
    }) => {
      const response = await fetch("/api/blog/metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error("Failed to create blog entry");
      }

      return (await response.json()) as BlogMetadata;
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch blog metadata
      void queryClient.invalidateQueries({
        queryKey: blogKeys.metadataByAuthor(variables.authorDid),
      });
    },
  });
}
