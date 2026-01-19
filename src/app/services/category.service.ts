import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private categories: Category[] = [
    {
      id: '1',
      nameAr: 'التعليم',
      description: 'انتهاكات متعلقة بالتعليم',
      icon: 'book',
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      nameAr: 'المشاركة السياسية',
      description: 'انتهاكات متعلقة بالمشاركة السياسية',
      icon: 'users',
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      nameAr: 'القضايا البيئية',
      description: 'انتهاكات بيئية',
      icon: 'leaf',
      order: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      nameAr: 'الشباب',
      description: 'قضايا الشباب',
      icon: 'user',
      order: 4,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  constructor() { }

  getCategories(): Observable<Category[]> {
    return of([...this.categories].sort((a, b) => a.order - b.order));
  }

  getCategoryById(id: string): Observable<Category | undefined> {
    return of(this.categories.find(cat => cat.id === id));
  }

  createCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>): Observable<Category> {
    const newCategory: Category = {
      ...category,
      id: (this.categories.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.categories.push(newCategory);
    return of(newCategory);
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category | undefined> {
    const index = this.categories.findIndex(cat => cat.id === id);
    if (index > -1) {
      this.categories[index] = {
        ...this.categories[index],
        ...category,
        updatedAt: new Date()
      };
      return of(this.categories[index]);
    }
    return of(undefined);
  }

  deleteCategory(id: string): Observable<boolean> {
    const initialLength = this.categories.length;
    this.categories = this.categories.filter(cat => cat.id !== id);
    return of(this.categories.length < initialLength);
  }

  reorderCategories(categoryIds: string[]): Observable<boolean> {
    categoryIds.forEach((id, index) => {
      const category = this.categories.find(cat => cat.id === id);
      if (category) {
        category.order = index + 1;
        category.updatedAt = new Date();
      }
    });
    return of(true);
  }
}
