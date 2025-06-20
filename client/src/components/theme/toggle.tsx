"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const toggleTheme = () => {
    // Simple toggle between light and dark, maintaining system preference when possible
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  // Determine if the switch should be checked
  // Use resolvedTheme for actual dark/light state, regardless of system setting
  const isChecked = resolvedTheme === "dark";

  return (
    <div className="flex items-center space-x-2">
      <Sun className="h-[1rem] w-[1rem] text-muted-foreground" />
      <Switch
        checked={isChecked}
        onCheckedChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
      <Moon className="h-[1rem] w-[1rem] text-muted-foreground" />

    </div>
  );
}