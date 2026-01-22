export interface CategoryDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

export interface AddCategoryDto {
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  id: number;
  name: string;
  description?: string;
}

export interface CategoryFilter {
  name?: string;
  description?: string;
  isActive?: boolean;
}

// Legacy interface for backward compatibility (if needed)
export interface Category extends CategoryDto {}
