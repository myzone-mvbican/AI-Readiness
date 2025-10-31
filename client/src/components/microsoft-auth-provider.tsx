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

  // Initialize MSAL instance
  const msalInstance = useMemo(() => {
    const instance = new PublicClientApplication(msalConfig);
    
    // Handle account selection
    if (!instance.getActiveAccount() && instance.getAllAccounts().length > 0) {
      instance.setActiveAccount(instance.getAllAccounts()[0]);
    }
    
    return instance;
  }, [msalConfig]);

  // Handle redirect promise on mount
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        await msalInstance.handleRedirectPromise();
      } catch (error) {
        console.error("[MSAL] Error handling redirect:", error);
      }
    };
    
    handleRedirect();
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