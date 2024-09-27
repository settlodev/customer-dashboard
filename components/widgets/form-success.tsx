import { Icon } from "@iconify/react";

interface FormSuccessProps {
  message: string | undefined;
}

export const FormSuccess = ({ message }: FormSuccessProps) => {
  if (!message) return null;

  return (
    <div className="bg-emerald-500/15 p-3 rounded-md flex items-center gap-x-2 text-sm text-emerald-500 justify-center">
      <Icon className="h-5 w-5" icon="icon-park-outline:success" />
      <p>{message}</p>
    </div>
  );
};
