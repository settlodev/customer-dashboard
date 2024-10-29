import {Button} from "@/components/ui/button";

type SubmitButtonProps = {
  label: string;
  isPending: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
};

export const SubmitButton = ({
  label,
  isPending,
  onClick
}: SubmitButtonProps) => {
  return (
    <Button
      color="primary"
      disabled={isPending}
      type="submit"
      onClick={onClick}
    >
      {label}
    </Button>
  );
};
