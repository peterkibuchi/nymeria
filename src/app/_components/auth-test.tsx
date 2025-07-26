"use client";

import { useState } from "react";

import { useAuth } from "~/lib/hooks/use-auth";
import { useSeenUsers } from "~/lib/hooks/use-user-data";

/**
 * Authentication Test Component
 *
 * Provides a comprehensive interface for testing the authentication flow.
 * Includes sign-in, session management, and database sync verification.
 *
 * Security: Displays only non-sensitive user information for testing purposes.
 * Never exposes tokens, session secrets, or other sensitive authentication data.
 */
export function AuthTest() {
  const [testIdent, setTestIdent] = useState("");
  const {
    session,
    user,
    isAuthenticated,
    isLoading,
    error,
    signIn,
    signOut,
    isSigningIn,
    isSigningOut,
    signInError,
    signOutError,
  } = useAuth();

  const { data: seenUsers } = useSeenUsers();

  const handleSignIn = () => {
    if (testIdent.trim()) {
      signIn({ ident: testIdent.trim() });
    }
  };

  const handleSignOut = () => {
    if (session?.sub) {
      signOut(session.sub);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Nymeria Authentication Test</h1>

      {/* Authentication Status */}
      <div className="rounded-lg border p-4">
        <h2 className="mb-2 text-lg font-semibold">Authentication Status</h2>
        <div className="space-y-2 text-sm">
          <p>
            <strong>Authenticated:</strong> {isAuthenticated ? "Yes" : "No"}
          </p>
          <p>
            <strong>Loading:</strong> {isLoading ? "Yes" : "No"}
          </p>
          {error && (
            <p className="text-red-600">
              <strong>Error:</strong> {error.message}
            </p>
          )}
        </div>
      </div>

      {/* Sign In Form */}
      {!isAuthenticated && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Sign In</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter handle or DID"
              value={testIdent}
              onChange={(e) => setTestIdent(e.target.value)}
              className="w-full rounded border px-3 py-2"
              disabled={isSigningIn}
            />
            <button
              onClick={handleSignIn}
              disabled={isSigningIn || !testIdent.trim()}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {isSigningIn ? "Signing In..." : "Sign In"}
            </button>
            {signInError && (
              <p className="text-sm text-red-600">
                Sign in error: {signInError.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* User Information */}
      {isAuthenticated && user && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">User Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>DID:</strong> {user.did}
            </p>
            <p>
              <strong>Handle:</strong> {user.handle}
            </p>
            {user.displayName && (
              <p>
                <strong>Display Name:</strong> {user.displayName}
              </p>
            )}
            {user.description && (
              <p>
                <strong>Description:</strong> {user.description}
              </p>
            )}
            <p>
              <strong>PDS:</strong> {user.pds}
            </p>
            <p>
              <strong>Last Seen:</strong>{" "}
              {new Date(user.lastSeenAt).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Session Information */}
      {isAuthenticated && session && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Session Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Session ID:</strong> {session.sessionId}
            </p>
            <p>
              <strong>Device ID:</strong> {session.deviceId}
            </p>
            <p>
              <strong>Subject:</strong> {session.sub}
            </p>
            {session.userMetadata?.displayName && (
              <p>
                <strong>Profile Name:</strong>{" "}
                {session.userMetadata.displayName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Seen Users */}
      {seenUsers && seenUsers.length > 0 && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Recently Seen Users</h2>
          <div className="space-y-2">
            {seenUsers.slice(0, 5).map((seenUser) => (
              <div
                key={seenUser.id}
                className="border-l-2 border-gray-200 pl-2 text-sm"
              >
                <p>
                  <strong>{seenUser.handle}</strong>
                </p>
                <p className="text-gray-600">
                  Last seen: {new Date(seenUser.lastSeenAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      {isAuthenticated && (
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 text-lg font-semibold">Sign Out</h2>
          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            {isSigningOut ? "Signing Out..." : "Sign Out"}
          </button>
          {signOutError && (
            <p className="mt-2 text-sm text-red-600">
              Sign out error: {signOutError.message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
