"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "~/lib/hooks/use-auth";

// import { LoadingSpinner } from '@/components/ui/loading-spinner'
// import { Alert, AlertDescription } from '@/components/ui/alert'

export default function OAuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);
  const { handleCallback } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const processCallback = async () => {
      try {
        const session = await handleCallback();

        if (session) {
          // Get redirect URL from state or default to home
          const urlParams = new URLSearchParams(window.location.search);
          const state = urlParams.get("state");

          let redirectUrl = "/";
          if (state) {
            try {
              const parsedState = JSON.parse(state) as { redirect?: string };
              redirectUrl = parsedState.redirect ?? "/";
            } catch {
              // Invalid state, use default
            }
          }

          router.replace(redirectUrl);
        } else {
          setError("Authentication failed. Please try again.");
        }
      } catch (err) {
        console.error("Callback error:", err);
        setError("An error occurred during authentication.");
      }
    };

    void processCallback();
  }, [handleCallback, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* <Alert className="max-w-md"> */}
        {/* <AlertDescription> */}
        {error}

        {/* </AlertDescription> */}
        {/* </Alert> */}
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {/* <LoadingSpinner className="mx-auto mb-4" /> */}
        <p>Completing authentication...</p>
      </div>
    </div>
  );
}
