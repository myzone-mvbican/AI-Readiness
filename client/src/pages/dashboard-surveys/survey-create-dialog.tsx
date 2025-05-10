import { useState, useEffect } from "react";
import { parse } from "papaparse";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
  DialogTrigger,
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
  Plus,
  X,
} from "lucide-react";

// Form schema with zod validation
const createSurveySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  visibility: z.union([
    z.literal("global"),
    z.literal("teams")
  ]).default("global"),
  selectedTeams: z.array(z.number()).optional(),
  status: z.enum(["draft", "public"]).default("draft"),
});

type CreateSurveyFormValues = z.infer<typeof createSurveySchema>;

interface CreateSurveyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SurveyCreateDialog({ open, onOpenChange }: CreateSurveyDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [questionsCount, setQuestionsCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch teams for the dropdown
  const { data: teamsData } = useQuery({
    queryKey: ["/api/admin/teams"],
    retry: false,
  });

  const teams = teamsData?.teams || [];

  // Initialize form
  const form = useForm<CreateSurveyFormValues>({
    resolver: zodResolver(createSurveySchema),
    defaultValues: {
      title: "",
      visibility: "global",
      selectedTeams: [],
      status: "draft",
    },
  });

  const resetForm = () => {
    form.reset({
      title: "",
      visibility: "global",
      selectedTeams: [],
      status: "draft",
    });
    setCsvFile(null);
    setQuestionsCount(0);
    setIsUploading(false);
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Create a new survey
  const createSurveyMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest(
        "POST",
        "/api/admin/surveys",
        formData,
        true
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create survey");
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
        description: "Survey created successfully",
      });
      resetForm();
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
      setQuestionsCount(0);
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

  // Handle form submission to create a new survey
  const onSubmit = async (data: CreateSurveyFormValues) => {
    console.log("Form data:", data);

    if (!csvFile) {
      toast({
        title: "Missing file",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
      return;
    }

    if (questionsCount === 0) {
      toast({
        title: "Invalid CSV",
        description: "No valid questions found in the CSV file",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("file", csvFile);
    formData.append("questionsCount", questionsCount.toString());
    formData.append("status", data.status);

    // Add teamIds if visibility is "teams"
    if (data.visibility === "teams" && data.selectedTeams && data.selectedTeams.length > 0) {
      formData.append("teamIds", JSON.stringify(data.selectedTeams));
    }

    createSurveyMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Survey
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Survey</DialogTitle>
          <DialogDescription>
            Upload a CSV file with survey questions.
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
              <FormLabel htmlFor="file">CSV File</FormLabel>
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
                        setQuestionsCount(0);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label
                    htmlFor="csv-upload"
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
                          Choose a CSV file or drag and drop
                        </span>
                      </div>
                    )}
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              {questionsCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Found {questionsCount} valid questions in the CSV.
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
                  !csvFile || 
                  isUploading || 
                  createSurveyMutation.isPending || 
                  !form.formState.isValid
                }
              >
                {createSurveyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Survey"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}