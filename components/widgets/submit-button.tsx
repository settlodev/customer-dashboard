import { Button } from "@nextui-org/react";

type SubmitButtonProps = {
  label: string;
  isPending: boolean;
  isDisabled?: boolean;
};

export const SubmitButton = ({
  label,
  isPending,
  isDisabled,
}: SubmitButtonProps) => {
  return (
    <Button
      color="primary"
      isDisabled={isDisabled}
      isLoading={isPending}
      radius="sm"
      type="submit"
    >
      {label}
    </Button>
  );
};
