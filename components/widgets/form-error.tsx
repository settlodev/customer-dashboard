import { Icon } from "@iconify/react";

interface FormErrorProps {
  message: string | undefined;
}

export const FormError = ({ message }: FormErrorProps) => {
  if (!message) return null;

  return (
    <div className="bg-destructive/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-destructive justify-center mb-3">
      <Icon className="h-5 w-5" icon="bi:exclamation-triangle" />
      <p>{message}</p>
    </div>
  );
};
