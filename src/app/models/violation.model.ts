import { QuestionAnswer } from './question.model';

export interface Violation {
  id?: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  location: string;
  city?: string;
  place?: string;
  reporterName: string;
  reporterEmail: string;
  reporterPhone?: string;
  status: 'draft' | 'pending' | 'investigating' | 'resolved' | 'rejected';
  reportedDate: Date;
  violationDate?: Date;
  attachments?: string[];
  answers?: QuestionAnswer[]; // Dynamic question answers
}

export interface ViolationCategory {
  id: string;
  name: string;
  description: string;
}
