import React from "react";
import { useMsal } from "@azure/msal-react";
import { InteractionType } from "@azure/msal-browser";
import { Button } from "@/components/ui/button";
import { loginRequest } from "@/components/microsoft-auth-provider";

interface MicrosoftLoginButtonProps {
  onSuccess: (response: any) => void;
  onError: () => void;
  text?: "signin_with" | "signup_with";
  disabled?: boolean;
}

export const MicrosoftLoginButton: React.FC<MicrosoftLoginButtonProps> = ({
  onSuccess,
  onError,
  text = "signin_with",
  disabled = false,
}) => {
  const { instance } = useMsal();

  const handleLogin = async () => {
    console.log("🚀 MICROSOFT BUTTON CLICKED!");
    alert("Microsoft button clicked - check console");
    
    try {
      console.log("=== Microsoft Login Debug ===");
      console.log("Starting Microsoft login popup...");
      
      // Trigger popup login
      const response = await instance.loginPopup(loginRequest);
      
      console.log("Microsoft login response:", {
        hasIdToken: !!response?.idToken,
        hasAccessToken: !!response?.accessToken,
        account: response?.account?.username,
        tokenLength: response?.idToken?.length
      });
      
      if (response && response.idToken) {
        console.log("ID Token (first 100 chars):", response.idToken.substring(0, 100) + "...");
        
        // Call success handler with the ID token
        onSuccess({
          credential: response.idToken,
        });
      } else {
        console.error("No ID token received from Microsoft");
        console.error("Full response:", response);
        onError();
      }
    } catch (error) {
      console.error("Microsoft login failed:", error);
      onError();
    }
  };

  const buttonText = text === "signup_with" 
    ? "Sign up with Microsoft" 
    : "Sign in with Microsoft";

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleLogin}
      disabled={disabled}
      className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
      data-testid="button-microsoft-login"
    >
      {/* Microsoft Logo SVG */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 21 21"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="12" y="1" width="9" height="9" fill="#00a4ef" />
        <rect x="1" y="12" width="9" height="9" fill="#ffb900" />
        <rect x="12" y="12" width="9" height="9" fill="#7fba00" />
      </svg>
      {buttonText}
    </Button>
  );
};