export interface PaginationParams {
  pageNumber: number;
  pageSize: number;
  isActive?: boolean;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
