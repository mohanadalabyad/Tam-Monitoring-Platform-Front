import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { SubCategory } from '../models/subcategory.model';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private subCategories: SubCategory[] = [
    {
      id: '1',
      categoryId: '1',
      nameAr: 'الوصول للمؤسسة التعليمية',
      description: 'انتهاكات متعلقة بالوصول للمؤسسات التعليمية',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      categoryId: '1',
      nameAr: 'جودة التعليم',
      description: 'انتهاكات متعلقة بجودة التعليم',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      categoryId: '3',
      nameAr: 'تلوث المياه',
      description: 'انتهاكات متعلقة بتلوث المياه',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      categoryId: '3',
      nameAr: 'تلوث الهواء',
      description: 'انتهاكات متعلقة بتلوث الهواء',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  constructor() { }

  getSubCategories(): Observable<SubCategory[]> {
    return of([...this.subCategories]);
  }

  getSubCategoriesByCategory(categoryId: string): Observable<SubCategory[]> {
    return of(
      [...this.subCategories]
        .filter(sub => sub.categoryId === categoryId)
        .sort((a, b) => a.order - b.order)
    );
  }

  getSubCategoryById(id: string): Observable<SubCategory | undefined> {
    return of(this.subCategories.find(sub => sub.id === id));
  }

  createSubCategory(subCategory: Omit<SubCategory, 'id' | 'createdAt' | 'updatedAt'>): Observable<SubCategory> {
    const newSubCategory: SubCategory = {
      ...subCategory,
      id: (this.subCategories.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.subCategories.push(newSubCategory);
    return of(newSubCategory);
  }

  updateSubCategory(id: string, subCategory: Partial<SubCategory>): Observable<SubCategory | undefined> {
    const index = this.subCategories.findIndex(sub => sub.id === id);
    if (index > -1) {
      this.subCategories[index] = {
        ...this.subCategories[index],
        ...subCategory,
        updatedAt: new Date()
      };
      return of(this.subCategories[index]);
    }
    return of(undefined);
  }

  deleteSubCategory(id: string): Observable<boolean> {
    const initialLength = this.subCategories.length;
    this.subCategories = this.subCategories.filter(sub => sub.id !== id);
    return of(this.subCategories.length < initialLength);
  }

  reorderSubCategories(subCategoryIds: string[]): Observable<boolean> {
    subCategoryIds.forEach((id, index) => {
      const subCategory = this.subCategories.find(sub => sub.id === id);
      if (subCategory) {
        subCategory.order = index + 1;
        subCategory.updatedAt = new Date();
      }
    });
    return of(true);
  }
}
