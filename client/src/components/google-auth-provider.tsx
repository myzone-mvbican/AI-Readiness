import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google"; 

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

// Google client ID should be set as an environment variable in production
// This is just a placeholder for development - replace with your actual client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  // Check if Google Client ID is configured
  if (!GOOGLE_CLIENT_ID) {
    // Still render children without GoogleOAuthProvider to avoid breaking the app
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => {
        console.error("[GoogleOAuthProvider] Script load error");
      }}
      onScriptLoadSuccess={() => {
        console.log("[GoogleOAuthProvider] Script loaded successfully");
      }}
    >
      {children}
    </GoogleOAuthProvider>
  );
};
