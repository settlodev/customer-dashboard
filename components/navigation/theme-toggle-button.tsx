"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import useColorMode from "@/components/hooks/useColorMode";

interface ThemeToggleButtonProps {
  className?: string;
}

export function ThemeToggleButton({ className }: ThemeToggleButtonProps) {
  const [colorMode, setColorMode] = useColorMode();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isDark = mounted && colorMode === "dark";

  return (
    <button
      type="button"
      onClick={() => setColorMode(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={
        className ??
        "grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      }
    >
      {!mounted ? (
        <span className="h-4 w-4" />
      ) : isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
