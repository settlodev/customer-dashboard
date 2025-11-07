import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface MhbSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ id: number; name: string; code?: string }>;
  placeholder: string;
  disabled?: boolean;
}

export function MhbSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled = false,
}: MhbSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <FormControl>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
      </FormControl>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id.toString()}>
            {option.name} {option.code && `(${option.code})`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
