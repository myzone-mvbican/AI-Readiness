import React from "react";
import { GoogleOAuthProvider } from "@react-oauth/google"; 

interface GoogleAuthProviderProps {
  children: React.ReactNode;
}

// Google client ID should be set as an environment variable in production
// This is just a placeholder for development - replace with your actual client ID
const GOOGLE_CLIENT_ID = import.meta.env.GOOGLE_CLIENT_ID;

export const GoogleAuthProvider: React.FC<GoogleAuthProviderProps> = ({
  children,
}) => {
  // Check if Google Client ID is configured
  if (!GOOGLE_CLIENT_ID) {
    console.warn("Google Client ID (GOOGLE_CLIENT_ID) is not configured. Google authentication will not work.");
    // Still render children without GoogleOAuthProvider to avoid breaking the app
    return <>{children}</>;
  }

  return (
    <GoogleOAuthProvider 
      clientId={GOOGLE_CLIENT_ID}
      onScriptLoadError={() => console.error("Google OAuth script failed to load")}
      onScriptLoadSuccess={() => console.log("Google OAuth script loaded successfully")}
    >
      {children}
    </GoogleOAuthProvider>
  );
};
