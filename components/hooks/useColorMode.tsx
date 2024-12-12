import { useEffect } from "react";
import useLocalStorage from "./useLocalStorage";

type ColorMode = "light" | "dark";
type SetColorMode = (value: ColorMode | ((prevValue: ColorMode) => ColorMode)) => void;

const useColorMode = (): [ColorMode, SetColorMode] => {
  const [colorMode, setColorMode] = useLocalStorage<ColorMode>("color-theme", "light");

  useEffect(() => {
    const className = "dark";
    const bodyClass = window.document.body.classList;

    const checkColor = () => {
      if (colorMode === "dark") {
        bodyClass.add(className);
      } else {
        bodyClass.remove(className);
      }
    };

    checkColor();
  }, [colorMode]);

  return [colorMode, setColorMode];
};

export default useColorMode;
