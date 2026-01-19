export type QuestionType = 
  'radio' | 'checkbox' | 'text' | 'textarea' | 'date' | 
  'time' | 'number' | 'scale' | 'yesno' | 'dropdown';

export interface QuestionOption {
  id: string;
  labelAr: string;
  labelEn: string;
  value: string;
  order: number;
}

export interface Question {
  id: string;
  categoryId: string; // Required - questions belong to categories
  type: QuestionType;
  labelAr: string;
  labelEn: string;
  description?: string;
  required: boolean;
  options?: QuestionOption[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  conditional?: {
    dependsOn: string; // question id
    showIf: string; // value to show
  };
  order: number;
  section?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuestionAnswer {
  questionId: string;
  value: any;
}
