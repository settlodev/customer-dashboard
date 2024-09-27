import {Button} from "@/components/ui/button";

type SubmitButtonProps = {
  label: string;
  isPending: boolean;
  isDisabled?: boolean;
};

export const SubmitButton = ({
  label,
  isPending,
}: SubmitButtonProps) => {
  return (
    <Button
      color="primary"
      disabled={isPending}
      type="submit"
    >
      {label}
    </Button>
  );
};
