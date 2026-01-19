export interface Category {
  id: string;
  nameAr: string;
  description?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}
