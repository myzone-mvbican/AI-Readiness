import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Loader2, FileBarChart2 } from "lucide-react";
import { useAssessment } from "@/hooks/use-assessment";
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
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getColumns } from "./columns";
import { apiRequest } from "@/lib/queryClient";
import type { SuccessResponse, PaginationMetadata } from "@shared/types";
import type { Assessment } from "@shared/types";

export default function AssessmentsPage() {
  const assessmentCreateModal = useAssessment();

  // Server-side state for pagination, filtering, and sorting
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  // Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to first page when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Build query parameters for the API
  const queryParams = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(sorting.length > 0 && {
      sortBy: sorting[0].id,
      sortOrder: sorting[0].desc ? "desc" : "asc",
    }),
  });

  // Fetch assessments from the API with server-side filtering/pagination
  const { data, isLoading, error } = useQuery<
    SuccessResponse<Assessment[]>
  >({
    queryKey: ["/api/assessments", queryParams.toString()],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/assessments?${queryParams}`);
      return res.json();
    },
    staleTime: 1000 * 30, // 30 seconds (shorter since we have pagination)
  });

  // Extract data and pagination metadata from response
  const assessments = data?.success ? data.data : [];
  const pagination = data?.metadata?.pagination;

  // Get columns configuration
  const columns = getColumns();

  // Set up table for server-side mode
  const table = useReactTable({
    data: assessments,
    columns,
    manualPagination: true, // Tell React Table we're handling pagination
    manualSorting: true, // Tell React Table we're handling sorting
    pageCount: pagination?.totalPages ?? -1,
    onSortingChange: (updater) => {
      setSorting(updater);
      setPage(1); // Reset to first page when sorting changes
    },
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    state: {
      sorting,
      columnVisibility,
      pagination: {
        pageIndex: page - 1,
        pageSize: pageSize,
      },
    },
  });

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

        {/* Search and filter controls - always visible */}
        <div className="flex items-center justify-between mb-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assessments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          {pagination && !isLoading && (
            <div className="text-sm text-muted-foreground">
              Showing {Math.min((page - 1) * pageSize + 1, pagination.totalItems)} to{" "}
              {Math.min(page * pageSize, pagination.totalItems)} of{" "}
              {pagination.totalItems} assessments
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
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

            {/* Server-side pagination controls */}
            <div className="flex items-center justify-between py-4">
              <div className="text-sm text-muted-foreground">
                {pagination && (
                  <>
                    Page {pagination.page} of {pagination.totalPages}
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination?.hasPrev || isLoading}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination?.hasNext || isLoading}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
