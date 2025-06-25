import { useState, useMemo } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  placeholder = "Search industries...",
  className,
}: IndustrySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  
  const industries = industriesData;

  // Get the selected industry's display text
  const selectedIndustry = useMemo(() => {
    return industries.find((industry) => industry.code === field.value);
  }, [field.value, industries]);

  // Filter industries based on search
  const filteredIndustries = useMemo(() => {
    if (!search) return industries.slice(0, 50); // Show first 50 when no search
    
    const searchLower = search.toLowerCase();
    return industries.filter((industry) => 
      industry.name.toLowerCase().includes(searchLower) ||
      String(industry.code).toLowerCase().includes(searchLower)
    ).slice(0, 100); // Limit to 100 results for performance
  }, [search, industries]);

  const selectElement = (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedIndustry ? (
            <span className="truncate">
              {selectedIndustry.name}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {search ? "No industries found." : "Start typing to search..."}
            </CommandEmpty>
            <CommandGroup>
              {filteredIndustries.map((industry) => (
                <CommandItem
                  key={String(industry.code)}
                  value={String(industry.code)}
                  onSelect={(currentValue) => {
                    field.onChange(currentValue === field.value ? "" : currentValue);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      field.value === industry.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{industry.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Code: {industry.code}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );

  return formControl ? (
    <FormControl className={className}>{selectElement}</FormControl>
  ) : (
    selectElement
  );
}
