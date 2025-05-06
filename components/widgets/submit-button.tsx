import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type SubmitButtonProps = {
  label: string;
  isPending: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  margin?: number;
  className?: string;
};

export const SubmitButton = ({
     label,
     isPending,
     isDisabled,
     onClick,
     margin,
     className
   }: SubmitButtonProps) => {
  return (
      <Button
          type="submit"
          disabled={isPending || isDisabled}
          onClick={onClick}
          className={`${margin ? `mt-${margin}` : ''} ${className || ''}`}
      >
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {isPending ? "Processing..." : label}
      </Button>
  );
};

export default SubmitButton;
