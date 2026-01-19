import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge' | 'actions';
  width?: string;
  render?: (value: any, row: any) => string;
}

export interface TableAction {
  label: string;
  icon?: string;
  action: (row: any) => void;
  class?: string;
}

@Component({
  selector: 'app-unified-table',
  templateUrl: './unified-table.component.html',
  styleUrls: ['./unified-table.component.scss']
})
export class UnifiedTableComponent implements OnInit, OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() actions: TableAction[] = [];
  @Input() pageSize: number = 10;
  @Input() showPagination: boolean = true;
  @Input() showSearch: boolean = true;
  @Input() emptyMessage: string = 'لا توجد بيانات';

  @Output() rowClick = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();

  filteredData: any[] = [];
  sortedData: any[] = [];
  paginatedData: any[] = [];
  
  currentPage: number = 1;
  totalPages: number = 1;
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  columnFilters: { [key: string]: string } = {};

  ngOnInit(): void {
    this.applyFilters();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.applyFilters();
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    this.applyFilters();
  }

  onFilterChange(columnKey: string, value: string): void {
    this.columnFilters[columnKey] = value;
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters(): void {
    // Start with original data
    let result = [...this.data];

    // Apply search
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      result = result.filter(row => {
        return this.columns.some(col => {
          const value = this.getCellValue(row, col.key);
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    // Apply column filters
    Object.keys(this.columnFilters).forEach(key => {
      const filterValue = this.columnFilters[key];
      if (filterValue) {
        result = result.filter(row => {
          const cellValue = String(this.getCellValue(row, key)).toLowerCase();
          return cellValue.includes(filterValue.toLowerCase());
        });
      }
    });

    // Apply sorting
    if (this.sortColumn) {
      result.sort((a, b) => {
        const aValue = this.getCellValue(a, this.sortColumn);
        const bValue = this.getCellValue(b, this.sortColumn);
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
        
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    this.filteredData = result;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredData.length / this.pageSize);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedData = this.filteredData.slice(start, end);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      this.pageChange.emit(page);
    }
  }

  getCellValue(row: any, key: string): any {
    return key.split('.').reduce((obj, k) => obj?.[k], row);
  }

  getCellDisplay(row: any, column: TableColumn): string {
    const value = this.getCellValue(row, column.key);
    if (column.render) {
      return column.render(value, row);
    }
    return value ?? '';
  }

  onRowClick(row: any): void {
    this.rowClick.emit(row);
  }

  onActionClick(action: TableAction, row: any, event: Event): void {
    event.stopPropagation();
    action.action(row);
  }

  getSortIcon(column: TableColumn): string {
    if (this.sortColumn !== column.key) {
      return 'sort';
    }
    return this.sortDirection === 'asc' ? 'sort-up' : 'sort-down';
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  hasFilterableColumns(): boolean {
    return this.columns.some(c => c.filterable);
  }

  getMinValue(a: number, b: number): number {
    return Math.min(a, b);
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredData.length);
  }
}
