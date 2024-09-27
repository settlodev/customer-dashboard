import { Badge } from "@/components/ui/badge";

interface BadgeColumnProps {
  value: string;
}

export const BadgeColumn = ({ value }: BadgeColumnProps): JSX.Element => {
  return <Badge variant={`outline`}>{value}</Badge>;
};
