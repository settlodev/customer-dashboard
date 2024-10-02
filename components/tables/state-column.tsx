import { Badge } from "@/components/ui/badge";
import {clsx} from "clsx";

interface StateColumnProps {
  state: boolean;
}

export const StateColumn = ({ state }: StateColumnProps): JSX.Element => {
  return (
    <>
      <Badge variant={state ? "secondary" : "destructive"} className="bg-gray-100 text-gray-800">
          <span className={clsx(state ? "bg-emerald-500" : "bg-danger-500","rounded-full w-2 h-2 mr-2 text-gray-800")}></span>{state ? "Active" : "Inactive"}
      </Badge>
    </>
  );
};
