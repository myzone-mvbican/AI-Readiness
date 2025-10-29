import { useState, useEffect } from "react";
import { parse } from "papaparse";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SurveyWithAuthor } from "@shared/types";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Check,
  ChevronsUpDown,
  FileSpreadsheet,
  FileUp,
  Loader2,
  X,
} from "lucide-react";

// Form schema with zod validation
const editSurveySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  visibility: z
    .union([z.literal("global"), z.literal("teams")])
    .default("global"),
  selectedTeams: z.array(z.number()).optional(),
  status: z.enum(["draft", "public"]).default("draft"),
  completionType: z.enum(["unlimited", "limited"]).default("unlimited"),
  completionLimit: z.number().min(1, "Completion limit must be at least 1").optional(),
});

type EditSurveyFormValues = z.infer<typeof editSurveySchema>;

interface EditSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  survey: SurveyWithAuthor;
}

export default function SurveyEditDialog({
  open,
  onOpenChange,
  survey,
}: EditSurveyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [questionsCount, setQuestionsCount] = useState(survey.questionsCount);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch teams for the dropdown
  const { data: teams } = useQuery({
    queryKey: ["/api/admin/teams"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/teams");
      const { data } = await res.json();
      return data || [];
    },
    select: (data) => data.data || [],
    retry: false,
  });

  // Get team IDs directly from the survey.teams array
  const surveyTeamIds = (survey.teams || []).map((team) => team.id);

  // Initialize form
  const form = useForm<EditSurveyFormValues>({
    resolver: zodResolver(editSurveySchema),
    defaultValues: {
      title: survey.title,
      visibility: surveyTeamIds.length > 0 ? "teams" : "global",
      selectedTeams: surveyTeamIds,
      status: survey.status as "draft" | "public",
    },
  });

  // Reset and update form only when the survey ID changes
  useEffect(() => {
    if (survey) {
      // Get team IDs from survey.teams
      const teamIds = (survey.teams || []).map((team) => team.id);
      const visibility = teamIds.length > 0 ? "teams" : "global";

      // Create properly typed form values that match EditSurveyFormValues
      const formValues: EditSurveyFormValues = {
        title: survey.title,
        visibility: visibility,
        selectedTeams: teamIds.length > 0 ? teamIds : undefined,
        status: survey.status === "draft" || survey.status === "public" ? survey.status : "draft",
        completionType: survey.completionLimit ? "limited" : "unlimited",
        completionLimit: survey.completionLimit || undefined,
      };

      // Initialize the form once with setTimeout to prevent infinite loops
      setTimeout(() => {
        form.reset(formValues);
        setQuestionsCount(survey.questionsCount);
      }, 0);
    }
  }, [survey.id, survey.teams]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCsvFile(null);
    }
  }, [open]);

  // Update an existing survey
  const updateSurveyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest("PUT", `/api/admin/surveys/${survey.id}`, formData, true);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update survey");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate all survey-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys"],
      });
      // Invalidate all global survey-related queries
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys/0"],
      });
      // Also invalidate specific survey detail
      queryClient.invalidateQueries({
        queryKey: [`/api/admin/surveys/detail/${survey.id}`],
      });
      onOpenChange(false);
      toast({
        title: "Success",
        description: "Survey updated successfully",
      });
      setCsvFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle CSV file upload and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setCsvFile(null);
      return;
    }

    const file = e.target.files[0];
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setCsvFile(file);
    setIsUploading(true);

    try {
      // Parse the CSV file to count valid questions
      const text = await file.text();
      parse(text, {
        header: true,
        complete: (results) => {
          // Count rows that have a non-empty Question Summary column
          const validQuestions = results.data.filter((row: any) => {
            // Check if the row has a non-empty Question Summary or similar field
            return Object.values(row).some(
              (value) => typeof value === "string" && value.trim().length > 0,
            );
          }).length;

          setQuestionsCount(validQuestions);
          setIsUploading(false);
        },
        error: () => {
          toast({
            title: "Error parsing CSV",
            description: "The CSV file could not be parsed correctly",
            variant: "destructive",
          });
          setIsUploading(false);
        },
      });
    } catch (error) {
      toast({
        title: "Error reading file",
        description: "The file could not be read",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  };

  // Handle form submission to update the survey
  const onSubmit = async (data: EditSurveyFormValues) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("status", data.status);

    // Add completion limit if limited type is selected
    if (data.completionType === "limited" && data.completionLimit) {
      formData.append("completionLimit", data.completionLimit.toString());
    } else {
      formData.append("completionLimit", ""); // Send empty string for unlimited
    }

    // Add teamIds if visibility is "teams"
    if (
      data.visibility === "teams" &&
      data.selectedTeams &&
      data.selectedTeams.length > 0
    ) {
      formData.append("teamIds", JSON.stringify(data.selectedTeams));
    } else {
      formData.append("teamIds", JSON.stringify([]));
    }

    console.log(formData.get("teamIds"));

    // If a new file was uploaded, include it
    if (csvFile) {
      formData.append("file", csvFile);
      formData.append("questionsCount", questionsCount.toString());
    }

    updateSurveyMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Survey</DialogTitle>
          <DialogDescription>
            Update survey details or replace the CSV file.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-1 md:col-span-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Survey Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter survey title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="col-span-1 md:col-span-1">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value as "draft" | "public"}
                        onValueChange={(value: "draft" | "public") => {
                          // Use setTimeout to avoid maximum update depth exceeded error
                          setTimeout(() => {
                            field.onChange(value);
                          }, 0);
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="public">Public</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    value={field.value as "global" | "teams"}
                    onValueChange={(value: "global" | "teams") => {
                      // Use setTimeout to avoid maximum update depth exceeded error
                      setTimeout(() => {
                        field.onChange(value);
                      }, 0);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="global">Global (Everyone)</SelectItem>
                      <SelectItem value="teams">Specific Teams</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("visibility") === "teams" && (
              <FormField
                control={form.control}
                name="selectedTeams"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Teams</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`justify-between ${!field.value?.length && "text-muted-foreground"}`}
                          >
                            {field.value?.length
                              ? `${field.value.length} team${field.value.length > 1 ? "s" : ""} selected`
                              : "Select teams"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search teams..." />
                          <CommandEmpty>No teams found.</CommandEmpty>
                          <CommandGroup>
                            {teams.filter((team: any) => !team.name.includes('(deleted)')).map((team: any) => (
                              <CommandItem
                                key={team.id}
                                value={team.name}
                                onSelect={() => {
                                  const newValue = field.value?.includes(
                                    team.id,
                                  )
                                    ? field.value.filter(
                                      (value: number) => value !== team.id,
                                    )
                                    : [...(field.value || []), team.id];

                                  // Use setTimeout to avoid maximum update depth exceeded error
                                  setTimeout(() => {
                                    form.setValue("selectedTeams", newValue);
                                  }, 0);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${field.value?.includes(team.id)
                                      ? "opacity-100"
                                      : "opacity-0"
                                    }`}
                                />
                                {team.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {field.value?.map((teamId: number) => {
                        const team = teams.find((t: any) => t.id === teamId);
                        return team ? (
                          <Badge
                            key={teamId}
                            variant="secondary"
                            className="mr-1 mb-1"
                          >
                            {team.name}
                            <X
                              className="ml-1 h-3 w-3 cursor-pointer"
                              onClick={() => {
                                const newValue =
                                  field.value &&
                                  field.value.filter(
                                    (id: number) => id !== teamId,
                                  );
                                // Use setTimeout to avoid maximum update depth exceeded error
                                setTimeout(() => {
                                  form.setValue("selectedTeams", newValue);
                                }, 0);
                              }}
                            />
                          </Badge>
                        ) : null;
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Completion Limit Section */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="completionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Completion Limit</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value: "unlimited" | "limited") => {
                        field.onChange(value);
                        if (value === "unlimited") {
                          form.setValue("completionLimit", undefined);
                        }
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select completion type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="unlimited">Unlimited - Users can take this survey multiple times</SelectItem>
                        <SelectItem value="limited">Limited - Restrict number of completions per user</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("completionType") === "limited" && (
                <FormField
                  control={form.control}
                  name="completionLimit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Completions</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="Enter number (e.g., 1, 3, 5)"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value ? parseInt(value, 10) : undefined);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid gap-2">
              <FormLabel htmlFor="file">Replace CSV File (Optional)</FormLabel>
              <div className="border border-input rounded-md px-3 py-2">
                {csvFile ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      <span className="text-sm truncate max-w-[300px]">
                        {csvFile.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCsvFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="edit-csv-upload"
                    className="flex items-center justify-center w-full h-20 cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span>Analyzing file...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-2">
                        <FileUp className="h-8 w-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Choose a new CSV file (optional)
                        </span>
                      </div>
                    )}
                    <input
                      id="edit-csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              {csvFile && questionsCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Found {questionsCount} valid questions in the new CSV.
                </p>
              )}
              {!csvFile && (
                <p className="text-sm text-muted-foreground">
                  Current survey has {survey.questionsCount} questions.
                </p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                type="button"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isUploading ||
                  updateSurveyMutation.isPending ||
                  !form.formState.isValid
                }
              >
                {updateSurveyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Survey"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
