import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Pencil, Trash2, MoreVertical, UserPlus, ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Power, PowerOff } from 'lucide-angular';
import { PaginationResponse } from '../../models/pagination.model';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge' | 'actions' | 'toggle' | 'chip' | 'icon';
  width?: string;
  render?: (value: any, row: any) => string;
  toggleAction?: (row: any, event: Event) => void; // Custom toggle action
  isToggling?: (row: any) => boolean; // Check if toggling
  iconRenderer?: (value: any, row: any) => any; // Custom icon renderer
}

export interface TableAction {
  label: string;
  icon?: any; // Lucide icon component
  action: (row: any) => void;
  class?: string;
  variant?: 'primary' | 'danger' | 'warning' | 'info' | 'success';
  showLabel?: boolean; // Whether to show label or just icon
  condition?: (row: any) => boolean; // Condition to show/hide action
}

@Component({
  selector: 'app-unified-table',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
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
  
  // Server-side pagination inputs
  @Input() serverSidePagination: boolean = false;
  @Input() totalCount: number = 0;
  @Input() currentPageNumber: number = 1;
  @Input() totalPagesCount: number = 1;

  @Output() rowClick = new EventEmitter<any>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();
  @Output() searchChange = new EventEmitter<string>();

  filteredData: any[] = [];
  sortedData: any[] = [];
  paginatedData: any[] = [];
  
  currentPage: number = 1;
  totalPages: number = 1;
  searchTerm: string = '';
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  columnFilters: { [key: string]: string } = {};
  
  // Lucide icons
  Pencil = Pencil;
  Trash2 = Trash2;
  MoreVertical = MoreVertical;
  UserPlus = UserPlus;
  ChevronUp = ChevronUp;
  ChevronDown = ChevronDown;
  Search = Search;
  ChevronLeft = ChevronLeft;
  ChevronRight = ChevronRight;
  Power = Power;
  PowerOff = PowerOff;

  ngOnInit(): void {
    if (this.serverSidePagination) {
      this.currentPage = this.currentPageNumber;
      this.totalPages = this.totalPagesCount;
      this.paginatedData = [...this.data];
    } else {
      this.applyFilters();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.serverSidePagination) {
      if (changes['data']) {
        this.paginatedData = [...this.data];
      }
      if (changes['currentPageNumber']) {
        this.currentPage = this.currentPageNumber;
      }
      if (changes['totalPagesCount']) {
        this.totalPages = this.totalPagesCount;
      }
    } else {
      if (changes['data'] || changes['pageSize']) {
        this.applyFilters();
      }
    }
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.currentPage = 1;
    if (this.serverSidePagination) {
      this.searchChange.emit(term);
    } else {
      this.applyFilters();
    }
  }

  onSort(column: TableColumn): void {
    if (!column.sortable) return;

    if (this.sortColumn === column.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column.key;
      this.sortDirection = 'asc';
    }

    if (this.serverSidePagination) {
      this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
    } else {
      this.applyFilters();
    }
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
      if (!this.serverSidePagination) {
        this.updatePagination();
      }
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

  getSortIcon(column: TableColumn): any {
    if (this.sortColumn !== column.key) {
      return null; // No icon when not sorted
    }
    return this.sortDirection === 'asc' ? ChevronUp : ChevronDown;
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
    if (this.serverSidePagination) {
      return (this.currentPage - 1) * this.pageSize + 1;
    }
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndIndex(): number {
    if (this.serverSidePagination) {
      return Math.min(this.currentPage * this.pageSize, this.totalCount);
    }
    return Math.min(this.currentPage * this.pageSize, this.filteredData.length);
  }
  
  getTotalCount(): number {
    return this.serverSidePagination ? this.totalCount : this.filteredData.length;
  }
  
  getDefaultIcon(action: TableAction): any {
    if (action.icon) {
      return action.icon;
    }
    // Default icons based on action class
    if (action.class?.includes('edit') || action.class?.includes('btn-edit')) {
      return Pencil;
    }
    if (action.class?.includes('delete') || action.class?.includes('btn-delete')) {
      return Trash2;
    }
    return MoreVertical;
  }
}
