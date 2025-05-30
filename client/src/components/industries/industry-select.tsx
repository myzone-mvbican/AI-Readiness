import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl } from "@/components/ui/form";

interface IndustryOption {
  code: string;
  name: string;
}

interface IndustrySelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  // For react-hook-form compatibility
  field?: {
    value: string;
    onChange: (value: string) => void;
  };
  // For Controller usage
  formControl?: boolean;
}

export function IndustrySelect({
  value,
  onValueChange,
  placeholder = "Select industry",
  className,
  disabled = false,
  error = false,
  field,
  formControl = false,
}: IndustrySelectProps) {
  const [industries, setIndustries] = useState<IndustryOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await fetch("/industries.json");
        const data = await response.json();
        
        const industriesArray = Object.entries(data).map(([code, name]) => ({
          code,
          name: name as string,
        }));
        
        setIndustries(industriesArray);
      } catch (error) {
        console.error("Failed to load industries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadIndustries();
  }, []);

  // Handle react-hook-form field prop
  const currentValue = field?.value || value;
  const handleChange = field?.onChange || onValueChange;

  const selectElement = (
    <Select
      value={currentValue}
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger
        className={`${className || ""} ${error ? "border-red-500" : ""}`}
      >
        <SelectValue 
          placeholder={isLoading ? "Loading industries..." : placeholder} 
        />
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
    <FormControl>{selectElement}</FormControl>
  ) : (
    selectElement
  );
}

// Helper hook to get industry name by code
export function useIndustryName(code?: string): string {
  const [industries, setIndustries] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const response = await fetch("/industries.json");
        const data = await response.json();
        setIndustries(data);
      } catch (error) {
        console.error("Failed to load industries:", error);
      }
    };

    loadIndustries();
  }, []);

  return code && industries[code] ? industries[code] : code || "";
}

// Utility function to get all industries (for validation schemas)
export async function getIndustryCodes(): Promise<string[]> {
  try {
    const response = await fetch("/industries.json");
    const data = await response.json();
    return Object.keys(data);
  } catch (error) {
    console.error("Failed to load industry codes:", error);
    return [];
  }
}