import { Badge } from "@/components/ui/badge";

interface StateColumnProps {
  state: boolean;
}

export const StateColumn = ({ state }: StateColumnProps): JSX.Element => {
  return (
    <>
      <Badge variant={state ? "secondary" : "destructive"}>
        {state ? "Active" : "Inactive"}
      </Badge>
    </>
  );
};
