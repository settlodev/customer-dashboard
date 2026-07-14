"use client"

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import useColorMode from "@/components/hooks/useColorMode";

const ThemeSwitcher = () => {
  const [colorMode, setColorMode] = useColorMode();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9" />;
  }

  const toggleTheme = () => {
    setColorMode(colorMode === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="h-9 w-9 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
    >
      {colorMode === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeSwitcher;
