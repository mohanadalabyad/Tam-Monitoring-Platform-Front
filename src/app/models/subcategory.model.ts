export interface SubCategoryDto {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  categoryName?: string;
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

export interface AddSubCategoryDto {
  name: string;
  description?: string;
  categoryId: number;
}

export interface UpdateSubCategoryDto {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
}

export interface SubCategoryFilter {
  name?: string;
  description?: string;
  categoryId?: number;
  isActive?: boolean;
}

// Legacy interface for backward compatibility (if needed)
export interface SubCategory extends SubCategoryDto {}
