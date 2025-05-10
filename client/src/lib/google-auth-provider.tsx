import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

// Google client ID should be set as an environment variable in production
// This is just a placeholder for development - replace with your actual client ID
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "894401584949-ieet20ddcm1bstdfv5lumiktnigg7agu.apps.googleusercontent.com";

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {children}
    </GoogleOAuthProvider>
  );
};
