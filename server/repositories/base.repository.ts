import { Transaction } from "drizzle-orm";

/**
 * Base repository interface providing common CRUD operations
 * All repositories should extend this interface for consistency
 */
export interface BaseRepository<T> {
  create(data: any, tx?: Transaction): Promise<T>;
  getById(id: number, tx?: Transaction): Promise<T | null>;
  update(id: number, data: any, tx?: Transaction): Promise<T>;
  delete(id: number, tx?: Transaction): Promise<boolean>;
  getAll(filters?: any, tx?: Transaction): Promise<T[]>;
}

/**
 * Pagination options for list operations
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated result structure
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Filter options for repository queries
 */
export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
  [key: string]: any;
}
