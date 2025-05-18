import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Loader2, FileBarChart2 } from "lucide-react";
import { useAssessmentCreateModal } from "@/hooks/use-assessment-create-modal";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getColumns } from "./columns";
import { AssessmentsResponse } from "./types";

export default function AssessmentsPage() {
  const assessmentCreateModal = useAssessmentCreateModal();

  // State for sorting and filtering
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'completedOn', desc: true } // Default sort by completedOn in descending order
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // Fetch assessments from the API
  const { data, isLoading, error } = useQuery<AssessmentsResponse>({
    queryKey: ["/api/assessments"],
    staleTime: 1000 * 60, // 1 minute
  });

  const assessments = data?.assessments || [];

  // Get columns configuration
  const columns = getColumns();

  // Set up table
  const table = useReactTable({
    data: assessments,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout title="Your Assessments">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Your Assessments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 space-y-3">
          <div className="col-span-1">
            <div className="col-span-1 flex items-center space-x-2">
              <FileBarChart2 className="h-6 w-6 text-foreground" />
              <h2 className="text-xl text-foreground font-semibold">
                Your Assessments
              </h2>
            </div>
            <p className="text-muted-foreground mt-2">
              View all your completed and in-progress AI readiness assessments.
            </p>
          </div>
          <div className="col-span-1 flex md:justify-end">
            <Button
              className="w-full md:w-auto"
              onClick={assessmentCreateModal.onOpen}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Start New Assessment
            </Button>
          </div>
        </div>

        {error ? (
          // Error state
          <div className="text-center py-8 text-red-500">
            <p>Failed to load assessments. Please try again.</p>
          </div>
        ) : assessments.length === 0 ? (
          // Empty state
          <div className="text-center py-8 text-muted-foreground">
            <p>You haven't created any assessments yet.</p>
            <p className="mt-2">
              Click the "New Assessment" button to get started.
            </p>
          </div>
        ) : (
          <>
            {/* Search and filter controls */}
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assessments..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {/* Assessments data table */}
            <div className="relative rounded-md border overflow-auto">
              <Table className="w-full whitespace-nowrap">
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="p-0 px-4">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No assessments found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
