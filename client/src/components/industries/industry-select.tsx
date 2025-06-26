import { useState, useMemo } from "react";
import { ControllerRenderProps } from "react-hook-form";
import { Check, ChevronsUpDown, Search, Wand2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useToast } from "@/hooks/use-toast";
import { industriesData } from "@/lib/industry-validation";
import { apiRequest } from "@/lib/queryClient";

// Frontend URL validation schema
const urlSchema = z.string()
  .min(1, "URL is required")
  .url("Please enter a valid URL")
  .refine(
    (url) => {
      try {
        const parsedUrl = new URL(url);
        return ['http:', 'https:'].includes(parsedUrl.protocol);
      } catch {
        return false;
      }
    },
    "URL must use HTTP or HTTPS protocol"
  );

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
  const [urlPopoverOpen, setUrlPopoverOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  
  const { toast } = useToast();
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

  // URL validation and change handler
  const handleUrlChange = (value: string) => {
    setUrl(value);
    setUrlError(null);
    
    if (value.trim()) {
      const validation = urlSchema.safeParse(value.trim());
      if (!validation.success) {
        setUrlError(validation.error.errors[0].message);
      }
    }
  };

  // URL analysis function with frontend validation
  const analyzeUrl = async () => {
    const trimmedUrl = url.trim();
    
    // Frontend validation using Zod
    const validation = urlSchema.safeParse(trimmedUrl);
    
    if (!validation.success) {
      const errorMessage = validation.error.errors[0].message;
      setUrlError(errorMessage);
      toast({
        title: "Invalid URL",
        description: errorMessage,
        variant: "destructive",
      });
      return;
    }

    setUrlError(null);
    setIsAnalyzing(true);
    
    try {
      const response = await apiRequest("POST", "/api/analyze-industry", { url: trimmedUrl });
      const result = await response.json();
      
      if (result.success && result.industryCode) {
        // Validate that the returned code exists in our industries data
        const foundIndustry = industries.find(industry => 
          String(industry.code) === String(result.industryCode)
        );
        
        if (foundIndustry) {
          field.onChange(String(foundIndustry.code));
          setUrlPopoverOpen(false);
          setUrl("");
          setUrlError(null);
          toast({
            title: "Industry detected",
            description: foundIndustry.name,
          });
        } else {
          toast({
            title: "Error",
            description: "Could not match detected industry to our database",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: result.message || "Could not analyze the website",
          variant: "destructive",
        });
      }
    } catch (error) { 
      toast({
        title: "Error",
        description: "Failed to analyze website. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectElement = (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("flex-1 justify-between max-w-[calc(100%-40px-.5rem)] px-3", className)}
          >
            {selectedIndustry ? (
              <span className="truncate font-normal">
                {selectedIndustry.name}
              </span>
            ) : (
              <span className="text-muted-foreground font-normal">{placeholder}</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popper-anchor-width] p-0" align="start">
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
      
      <Popover open={urlPopoverOpen} onOpenChange={setUrlPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            title="Analyze website to detect industry"
          >
            <Wand2 className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">AI Industry Detection</h4>
              <p className="text-sm text-muted-foreground">
                Enter a website URL to automatically detect the industry - it might take a couple of tries.
              </p>
            </div>
            <div className="space-y-2">
              <div className="space-y-1">
                <Input
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !isAnalyzing && !urlError) {
                      analyzeUrl();
                    }
                  }}
                  className={urlError ? "border-destructive" : ""}
                />
                {urlError && (
                  <p className="text-sm text-destructive">{urlError}</p>
                )}
              </div>
              <Button 
                onClick={analyzeUrl} 
                disabled={isAnalyzing || !url.trim() || !!urlError}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Detect Industry
                  </>
                )}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );

  return formControl ? (
    <FormControl className={className}>{selectElement}</FormControl>
  ) : (
    selectElement
  );
}
