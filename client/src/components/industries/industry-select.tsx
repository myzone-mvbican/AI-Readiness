import { useState, useEffect } from "react";
import { ControllerRenderProps } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";
import type { Industry } from "@/lib/industry-validation";

interface IndustrySelectProps {
  field: ControllerRenderProps<any, any>;
  formControl?: boolean;
  placeholder?: string;
}

export function IndustrySelect({ field, formControl = false, placeholder = "Select industry" }: IndustrySelectProps) {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await fetch('/industries.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setIndustries(data);
      } catch (error) {
        console.error('Failed to load industries:', error);
        setIndustries([]);
      } finally {
        setLoading(false);
      }
    };

    loadIndustries();
  }, []);

  const selectElement = (
    <Select
      onValueChange={field.onChange}
      value={field.value}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading industries..." : placeholder} />
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