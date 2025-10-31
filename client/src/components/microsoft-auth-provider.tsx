import React, { useMemo } from "react";
import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication, Configuration, LogLevel } from "@azure/msal-browser";

interface MicrosoftAuthProviderProps {
  children: React.ReactNode;
}

// Microsoft client ID should be set as an environment variable
const MICROSOFT_CLIENT_ID = import.meta.env.VITE_MICROSOFT_CLIENT_ID;

export const MicrosoftAuthProvider: React.FC<MicrosoftAuthProviderProps> = ({
  children,
}) => {
  // Check if Microsoft Client ID is configured
  if (!MICROSOFT_CLIENT_ID) {
    // Still render children without MsalProvider to avoid breaking the app
    return <>{children}</>;
  }

  // MSAL configuration
  const msalConfig: Configuration = useMemo(() => ({
    auth: {
      clientId: MICROSOFT_CLIENT_ID,
      authority: "https://login.microsoftonline.com/common", // Multi-tenant
      redirectUri: window.location.origin, // Use current origin
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: "sessionStorage", // More secure than localStorage
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        loggerCallback: (level, message, containsPii) => {
          if (containsPii) return;
          // Suppress all MSAL logging for production
        },
      },
    },
  }), []);

  // Initialize MSAL instance
  const msalInstance = useMemo(() => {
    const instance = new PublicClientApplication(msalConfig);
    
    // Handle account selection
    if (!instance.getActiveAccount() && instance.getAllAccounts().length > 0) {
      instance.setActiveAccount(instance.getAllAccounts()[0]);
    }
    
    return instance;
  }, [msalConfig]);

  return (
    <MsalProvider instance={msalInstance}>
      {children}
    </MsalProvider>
  );
};

// Export login request configuration for use in components
export const loginRequest = {
  scopes: ["openid", "profile", "email", "User.Read"], // Basic scopes for authentication + email
};