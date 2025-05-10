import { useState, useEffect } from "react";
import { parse } from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { SurveyWithAuthor } from "./survey-table";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { surveyStatusSchema } from "@shared/schema";

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
  X 
} from "lucide-react";

// Form schema with zod validation
const editSurveySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  visibility: z.union([
    z.literal("global"),
    z.literal("teams")
  ]).default("global"),
  selectedTeams: z.array(z.number()).optional(),
  status: z.enum(["draft", "public"]).default("draft"),
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
  survey 
}: EditSurveyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [questionsCount, setQuestionsCount] = useState(survey.questionsCount);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch teams for the dropdown
  const { data: teamsData } = useQuery({
    queryKey: ["/api/admin/teams"],
    retry: false,
  });

  const teams = teamsData?.teams || [];

  // Initialize form
  const form = useForm<EditSurveyFormValues>({
    resolver: zodResolver(editSurveySchema),
    defaultValues: {
      title: survey.title,
      visibility: survey.teamId ? String(survey.teamId) : "global",
      status: survey.status,
    },
  });

  // Reset and update form when survey changes
  useEffect(() => {
    if (survey) {
      form.reset({
        title: survey.title,
        visibility: survey.teamId ? String(survey.teamId) : "global",
        status: survey.status,
      });
      setQuestionsCount(survey.questionsCount);
    }
  }, [survey, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCsvFile(null);
    }
  }, [open]);

  // Update an existing survey
  const updateSurveyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "PUT",
        `/api/admin/surveys/${survey.id}`,
        formData,
        true
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update survey");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/surveys"],
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
        error: (error) => {
          console.error("Error parsing CSV:", error);
          toast({
            title: "Error parsing CSV",
            description: "The CSV file could not be parsed correctly",
            variant: "destructive",
          });
          setIsUploading(false);
        },
      });
    } catch (error) {
      console.error("Error reading file:", error);
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
    console.log("Form data:", data);

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("status", data.status);

    // Only add teamId if it's not "global"
    if (data.visibility !== "global") {
      // Handle array of team IDs if needed
      if (Array.isArray(data.visibility)) {
        // For now, we're using the first team ID only
        if (data.visibility.length > 0) {
          formData.append("teamId", data.visibility[0]);
        }
      } else {
        formData.append("teamId", data.visibility);
      }
    }

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
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Survey Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter survey title"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select
                      value={field.value as string}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="global">Global (Everyone)</SelectItem>
                        {teams.map((team: any) => (
                          <SelectItem key={team.id} value={String(team.id)}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
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