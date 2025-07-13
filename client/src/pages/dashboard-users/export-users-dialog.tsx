import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Download, FileText, Table as TableIcon, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { User } from "./types";

type ExportFormat = "csv" | "xlsx";

interface ExportableField {
  key: keyof User | "teamsString" | "lastLogin";
  label: string;
  defaultSelected: boolean;
}

const exportableFields: ExportableField[] = [
  { key: "name", label: "Name", defaultSelected: true },
  { key: "email", label: "Email", defaultSelected: true },
  { key: "role", label: "Role", defaultSelected: true },
  { key: "teamsString", label: "Teams", defaultSelected: true },
  { key: "company", label: "Company", defaultSelected: false },
  { key: "industry", label: "Industry", defaultSelected: false },
  { key: "employeeCount", label: "Employee Count", defaultSelected: false },
  { key: "createdAt", label: "Created Date", defaultSelected: true },
  { key: "lastLogin", label: "Last Login", defaultSelected: false },
];

interface ExportUsersDialogProps {
  children: React.ReactNode;
}

export function ExportUsersDialog({ children }: ExportUsersDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [selectedFields, setSelectedFields] = useState<Set<string>>(
    new Set(exportableFields.filter(f => f.defaultSelected).map(f => f.key))
  );
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  // Fetch all users for export (no pagination)
  const { data: allUsersData, isLoading: isLoadingAllUsers } = useQuery({
    queryKey: ["/api/admin/users/export"],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: "1",
        limit: "1000", // Large limit to get all users
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users for export");
      }

      return response.json();
    },
    enabled: isOpen, // Only fetch when dialog is open
    retry: false,
  });

  const handleFieldToggle = (fieldKey: string, checked: boolean) => {
    const newSelectedFields = new Set(selectedFields);
    if (checked) {
      newSelectedFields.add(fieldKey);
    } else {
      newSelectedFields.delete(fieldKey);
    }
    setSelectedFields(newSelectedFields);
  };

  const formatUserData = (users: User[]) => {
    return users.map(user => {
      const formattedUser: Record<string, any> = {};
      
      selectedFields.forEach(fieldKey => {
        switch (fieldKey) {
          case "name":
            formattedUser.Name = user.name;
            break;
          case "email":
            formattedUser.Email = user.email;
            break;
          case "role":
            formattedUser.Role = user.role;
            break;
          case "teamsString":
            formattedUser.Teams = user.teams?.map(t => `${t.name} (${t.role})`).join(", ") || "";
            break;
          case "company":
            formattedUser.Company = user.company || "";
            break;
          case "industry":
            formattedUser.Industry = user.industry || "";
            break;
          case "employeeCount":
            formattedUser["Employee Count"] = user.employeeCount || "";
            break;
          case "createdAt":
            formattedUser["Created Date"] = new Date(user.createdAt).toLocaleDateString();
            break;
          case "lastLogin":
            // Note: This would need to be added to the user data structure
            formattedUser["Last Login"] = "N/A"; // Placeholder for now
            break;
        }
      });
      
      return formattedUser;
    });
  };

  const generateFileName = (format: ExportFormat) => {
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return `users_export_${timestamp}.${format}`;
  };

  const exportToCSV = (data: Record<string, any>[]) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(","),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header]?.toString() || "";
          // Escape quotes and wrap in quotes if contains comma or quote
          return value.includes(",") || value.includes('"') 
            ? `"${value.replace(/"/g, '""')}"` 
            : value;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, generateFileName("csv"));
  };

  const exportToXLSX = (data: Record<string, any>[]) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    
    // Set column widths
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws["!cols"] = colWidths;
    
    XLSX.writeFile(wb, generateFileName("xlsx"));
  };

  const handleExport = async () => {
    if (selectedFields.size === 0) {
      toast({
        title: "No fields selected",
        description: "Please select at least one field to export.",
        variant: "destructive",
      });
      return;
    }

    if (!allUsersData?.users?.length) {
      toast({
        title: "No users to export",
        description: "There are no users available for export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for better UX
      const progressSteps = [20, 40, 60, 80, 100];
      for (let i = 0; i < progressSteps.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 200));
        setExportProgress(progressSteps[i]);
      }

      const formattedData = formatUserData(allUsersData.users);

      if (format === "csv") {
        exportToCSV(formattedData);
      } else {
        exportToXLSX(formattedData);
      }

      toast({
        title: "Export successful",
        description: `Exported ${allUsersData.users.length} users to ${format.toUpperCase()} format.`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "An error occurred during export.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const allFields = exportableFields.every(field => selectedFields.has(field.key));
  const noFields = selectedFields.size === 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Users
          </DialogTitle>
          <DialogDescription>
            Export user data to CSV or Excel format. Select the fields you want to include.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">Export Format</Label>
            <Select value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <TableIcon className="h-4 w-4" />
                    Excel (XLSX)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Field Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fields to Export</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFields(new Set(exportableFields.map(f => f.key)))}
                  disabled={allFields}
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFields(new Set())}
                  disabled={noFields}
                >
                  Clear All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-3">
              {exportableFields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2">
                  <Checkbox
                    id={field.key}
                    checked={selectedFields.has(field.key)}
                    onCheckedChange={(checked) => 
                      handleFieldToggle(field.key, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={field.key}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Exporting users...</span>
                <span>{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="w-full" />
            </div>
          )}

          {/* Summary */}
          {allUsersData && !isLoadingAllUsers && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
              Ready to export {allUsersData.users?.length || 0} users with {selectedFields.size} selected fields.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || isLoadingAllUsers || selectedFields.size === 0}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}