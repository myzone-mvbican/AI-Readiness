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
import type { IndustryCode } from "@/lib/industry-validation";

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
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await fetch('/industries.json');
        const data = await response.json();
        setIndustries(data);
      } catch (error) {
        console.error('Failed to load industries:', error);
        // Fallback industries if file can't be loaded
        setIndustries([
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
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadIndustries();
  }, []);

  const selectElement = (
    <Select
      onValueChange={field.onChange}
      defaultValue={field.value}
      disabled={loading}
    >
      <SelectTrigger>
        <SelectValue placeholder={loading ? "Loading..." : placeholder} />
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