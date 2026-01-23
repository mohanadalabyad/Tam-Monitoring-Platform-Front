// Question Type Enum (numeric)
export enum QuestionType {
  Text = 1,
  YesNo = 2,
  Rating = 3,
  MultipleChoice = 4,
  Date = 5,
  Number = 6
}

export interface QuestionDto {
  id: number;
  text: string;
  questionType: QuestionType; // 1-6
  order: number;
  isRequired: boolean;
  options: string | null; // JSON string for MultipleChoice type
  categoryId: number; // Link to category
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

export interface AddQuestionDto {
  text: string;
  questionType: QuestionType;
  order: number;
  isRequired: boolean;
  options?: string | null; // JSON string for MultipleChoice type
  categoryId: number; // Link to category
}

export interface UpdateQuestionDto {
  id: number;
  text: string;
  questionType: QuestionType;
  order: number;
  isRequired: boolean;
  options?: string | null; // JSON string for MultipleChoice type
  categoryId: number; // Link to category
}

export interface QuestionFilter {
  text?: string;
  questionType?: QuestionType;
  isRequired?: boolean;
  isActive?: boolean;
  categoryId?: number; // Filter by category
}

export interface QuestionAnswer {
  questionId: number;
  answerValue: string;
}

// Helper function to get question type label
export function getQuestionTypeLabel(type: QuestionType): string {
  const labels: { [key: number]: string } = {
    1: 'نص',
    2: 'نعم/لا',
    3: 'تقييم',
    4: 'اختيار متعدد',
    5: 'تاريخ',
    6: 'رقم'
  };
  return labels[type] || 'غير معروف';
}
