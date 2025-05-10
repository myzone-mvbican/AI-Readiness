import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileSpreadsheet,
  FileUp,
  X,
  Loader2,
} from "lucide-react";
import { parse } from "papaparse";
import { Team } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// Props for the survey form
interface SurveyFormProps {
  title: string;
  setTitle: (title: string) => void;
  teamId: number | null;
  setTeamId: (teamId: number | null) => void;
  status: string;
  setStatus: (status: string) => void;
  csvFile: File | null;
  setCsvFile: (file: File | null) => void;
  questionsCount: number;
  setQuestionsCount: (count: number) => void;
  isUploading: boolean;
  setIsUploading: (isUploading: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitButtonText: string;
}

export function SurveyForm({
  title,
  setTitle,
  teamId,
  setTeamId,
  status,
  setStatus,
  csvFile,
  setCsvFile,
  questionsCount,
  setQuestionsCount,
  isUploading,
  setIsUploading,
  onSubmit,
  submitButtonText,
}: SurveyFormProps) {
  const { toast } = useToast();
  
  // Fetch available teams for the team selector
  const { data: teamsData } = useQuery({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teams');
      const data = await response.json();
      return data.teams as Team[];
    }
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

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        {/* Survey Title */}
        <div className="grid gap-2">
          <Label htmlFor="title">Survey Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter survey title"
          />
        </div>

        {/* Team Selector */}
        <div className="grid gap-2">
          <Label htmlFor="team">Team Access</Label>
          <Select 
            value={teamId === null ? "global" : teamId.toString()} 
            onValueChange={(value) => {
              if (value === "global") {
                setTeamId(null);
              } else {
                setTeamId(parseInt(value));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select team access" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Global (everyone)</SelectItem>
              {teamsData?.map((team) => (
                <SelectItem key={team.id} value={team.id.toString()}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Selector */}
        <div className="grid gap-2">
          <Label htmlFor="status">Status</Label>
          <Select 
            value={status} 
            onValueChange={setStatus}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="public">Public</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* CSV File Upload */}
        <div className="grid gap-2">
          <Label htmlFor="file">CSV File</Label>
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
            <p className="text-sm text-green-600">
              {questionsCount} questions detected in the CSV file
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isUploading}>
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            submitButtonText
          )}
        </Button>
      </div>
    </form>
  );
}