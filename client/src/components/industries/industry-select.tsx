import { ControllerRenderProps } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import type { IndustryCode } from "@/lib/industry-validation";
// Import industries data directly
const industriesData = [
  { code: "541511", name: "Technology / Software" },
  { code: "621111", name: "Healthcare" },
  { code: "524210", name: "Finance / Insurance" },
  { code: "454110", name: "Retail / E-commerce" },
  { code: "31-33", name: "Manufacturing" },
  { code: "611310", name: "Education" },
  { code: "921190", name: "Government" },
  { code: "221118", name: "Energy / Utilities" },
  { code: "484121", name: "Transportation / Logistics" },
  { code: "999999", name: "Other" },
];

interface Industry {
  code: string;
  name: string;
}

interface IndustrySelectProps {
  field: ControllerRenderProps<any, any>;
  formControl?: boolean;
  placeholder?: string;
}

export function IndustrySelect({ field, formControl = false, placeholder = "Select industry" }: IndustrySelectProps) {
  const industries: Industry[] = industriesData;

  const selectElement = (
    <Select
      onValueChange={field.onChange}
      defaultValue={field.value}
    >
      <SelectTrigger>
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
    <FormControl>
      {selectElement}
    </FormControl>
  ) : (
    selectElement
  );
}