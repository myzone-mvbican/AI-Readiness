import { ControllerRenderProps } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import { industriesData } from "@/lib/industry-validation";

interface IndustrySelectProps {
  field: ControllerRenderProps<any, any>;
  formControl?: boolean;
  placeholder?: string;
  className?: string;
}

export function IndustrySelect({
  field,
  formControl = false,
  placeholder = "Select industry",
  className,
}: IndustrySelectProps) {
  const industries = industriesData;

  const selectElement = (
    <Select onValueChange={field.onChange} value={field.value}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {industries.map((industry) => (
          <SelectItem key={industry.code} value={industry.code}>
            {industry.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return formControl ? (
    <FormControl className={className}>{selectElement}</FormControl>
  ) : (
    selectElement
  );
}
