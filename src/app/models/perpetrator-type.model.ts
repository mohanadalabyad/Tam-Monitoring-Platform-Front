export interface PerpetratorTypeDto {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  categoryName?: string;
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

export interface AddPerpetratorTypeDto {
  name: string;
  description?: string;
  categoryId: number;
}

export interface UpdatePerpetratorTypeDto {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
}

export interface PerpetratorTypeFilter {
  name?: string;
  description?: string;
  categoryId?: number;
  isActive?: boolean;
}
