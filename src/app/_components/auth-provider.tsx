"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { useAuth } from "~/lib/hooks/use-auth";

// import { LoadingSpinner } from '~/components/ui/loading-spinner'

interface AuthContextType {
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType>({ isInitialized: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { isLoading } = useAuth();

  useEffect(() => {
    // Mark as initialized after first auth check
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        {/* <LoadingSpinner /> */}Loading
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isInitialized }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => useContext(AuthContext);
