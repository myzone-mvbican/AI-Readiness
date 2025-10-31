import React, { useMemo, useEffect } from "react";
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
    console.warn("Microsoft Client ID (VITE_MICROSOFT_CLIENT_ID) is not configured. Microsoft authentication will not work.");
    // Still render children without MsalProvider to avoid breaking the app
    return <>{children}</>;
  }

  // MSAL configuration
  const msalConfig: Configuration = useMemo(() => ({
    auth: {
      clientId: MICROSOFT_CLIENT_ID,
      authority: "https://login.microsoftonline.com/common", // Multi-tenant
      redirectUri: window.location.origin + '/auth',
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
          switch (level) {
            case LogLevel.Error:
              console.error("[MSAL] " + message);
              return;
            case LogLevel.Info:
              console.info("[MSAL] " + message);
              return;
            case LogLevel.Verbose:
              console.debug("[MSAL] " + message);
              return;
            case LogLevel.Warning:
              console.warn("[MSAL] " + message);
              return;
          }
        },
      },
    },
  }), []);

  // Initialize MSAL instance with proper initialization
  const msalInstance = useMemo(() => {
    return new PublicClientApplication(msalConfig);
  }, [msalConfig]);

  // Initialize MSAL and handle redirect promise
  useEffect(() => {
    const initializeMsal = async () => {
      try {
        // Initialize MSAL before any operations
        await msalInstance.initialize();
        
        // Handle redirect promise (for popup callback)
        await msalInstance.handleRedirectPromise();
        
        // Handle account selection
        const accounts = msalInstance.getAllAccounts();
        if (!msalInstance.getActiveAccount() && accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }
      } catch (error) {
        console.error("[MSAL] Initialization error:", error);
      }
    };
    
    initializeMsal();
  }, [msalInstance]);

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