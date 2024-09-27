import { formatDateTime } from "@/lib/utils";

interface DateTimeColumnProps {
  value?: string | null;
  type?: string;
}

export const DateTimeColumn = ({
  value,
  type,
}: DateTimeColumnProps): JSX.Element => {
  if (!value) {
    return <></>;
  }

  const formattedDate = formatDateTime(value);
  let displayDate: string;

  switch (type) {
    case "dateTime":
      displayDate = formattedDate.dateTime;
      break;
    case "dateDay":
      displayDate = formattedDate.dateDay;
      break;
    case "timeOnly":
      displayDate = formattedDate.timeOnly;
      break;
    case "dateOnly":
    default:
      displayDate = formattedDate.dateOnly;
      break;
  }

  return <>{displayDate}</>;
};
