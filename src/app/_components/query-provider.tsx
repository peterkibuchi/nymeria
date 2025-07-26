"use client";

import { useState } from "react";
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
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
