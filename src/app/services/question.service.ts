import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PaginationResponse } from '../models/pagination.model';
import { QuestionDto, AddQuestionDto, UpdateQuestionDto, QuestionFilter, QuestionType, getQuestionTypeLabel } from '../models/question.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private apiUrl = `${environment.apiUrl}/Question`;

  constructor(private http: HttpClient) {}

  /**
   * Get all questions with optional pagination
   * For main management pages: pass isActive as undefined to get ALL questions
   * For assignment contexts: pass isActive: true to get only active questions
   */
  getAllQuestions(
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<QuestionDto> | QuestionDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) {
      params = params.set('pageNumber', pageNumber.toString());
    }
    if (pageSize !== undefined) {
      params = params.set('pageSize', pageSize.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<PaginationResponse<QuestionDto> | QuestionDto[]>>(
      this.apiUrl,
      { params }
    );
  }

  /**
   * Get active questions by category for the private violation form. Authenticated only; does not require Question.Read.
   */
  getQuestionsByCategory(categoryId: number): Observable<ApiResponse<QuestionDto[]>> {
    return this.http.get<ApiResponse<QuestionDto[]>>(`${this.apiUrl}/by-category/${categoryId}`);
  }

  /**
   * Get all questions with filter
   */
  getAllQuestionsWithFilter(
    filter: QuestionFilter,
    pageNumber?: number,
    pageSize?: number,
    isActive?: boolean
  ): Observable<ApiResponse<PaginationResponse<QuestionDto> | QuestionDto[]>> {
    let params = new HttpParams();
    if (pageNumber !== undefined) params = params.set('pageNumber', pageNumber.toString());
    if (pageSize !== undefined) params = params.set('pageSize', pageSize.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());

    return this.http.post<ApiResponse<PaginationResponse<QuestionDto> | QuestionDto[]>>(
      `${this.apiUrl}/filter`,
      filter,
      { params }
    );
  }

  /**
   * Get question by ID
   */
  getQuestionById(id: number): Observable<QuestionDto> {
    return this.http.get<ApiResponse<QuestionDto>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Create a new question
   */
  createQuestion(questionData: AddQuestionDto): Observable<QuestionDto> {
    // Ensure questionType is a number (not string from form)
    const payload = {
      ...questionData,
      questionType: Number(questionData.questionType),
      categoryId: Number(questionData.categoryId),
      order: Number(questionData.order)
    };
    return this.http.post<ApiResponse<QuestionDto>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Update question
   */
  updateQuestion(questionData: UpdateQuestionDto): Observable<QuestionDto> {
    // Ensure questionType is a number (not string from form)
    const payload = {
      ...questionData,
      questionType: Number(questionData.questionType),
      categoryId: Number(questionData.categoryId),
      order: Number(questionData.order)
    };
    return this.http.put<ApiResponse<QuestionDto>>(this.apiUrl, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Delete a question
   */
  deleteQuestion(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
        })
      );
  }

  /**
   * Toggle question activity
   */
  toggleQuestionActivity(id: number): Observable<QuestionDto> {
    return this.http.post<ApiResponse<QuestionDto>>(`${this.apiUrl}/${id}/toggle-activity`, {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message);
          }
          return response.data;
        })
      );
  }

  /**
   * Get question type label for UI display
   */
  getQuestionTypeLabel(type: QuestionType): string {
    return getQuestionTypeLabel(type);
  }

  /**
   * Get all question types with labels for dropdown
   */
  getQuestionTypes(): { value: QuestionType; label: string }[] {
    return [
      { value: QuestionType.Text, label: 'نص' },
      { value: QuestionType.YesNo, label: 'نعم/لا' },
      { value: QuestionType.Rating, label: 'تقييم' },
      { value: QuestionType.MultipleChoice, label: 'اختيار متعدد' },
      { value: QuestionType.Date, label: 'تاريخ' },
      { value: QuestionType.Number, label: 'رقم' }
    ];
  }
}
