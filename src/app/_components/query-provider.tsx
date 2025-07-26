"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { queryClient } from "~/lib/query/client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider Component
 *
 * Provides React Query context with secure configuration for the entire application.
 * Includes development tools for debugging queries and mutations.
 *
 * Security: Uses singleton query client with secure retry policies and error handling.
 * Performance: Uses the singleton queryClient directly to prevent recreation on renders.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
