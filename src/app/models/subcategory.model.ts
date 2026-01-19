export interface SubCategory {
  id: string;
  categoryId: string;
  nameAr: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
