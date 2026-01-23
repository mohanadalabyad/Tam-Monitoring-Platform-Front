import { CityDto } from './city.model';
import { CategoryDto } from './category.model';
import { SubCategoryDto } from './subcategory.model';
import { UserDto } from './user-management.model';
import { QuestionAnswer } from './question.model';

// Violation Type Enum
export enum ViolationType {
  Public = 1,
  Private = 2
}

// Acceptance Status Enum
export enum AcceptanceStatus {
  Pending = 1,
  Approved = 2,
  Rejected = 3
}

// Publish Status Enum
export enum PublishStatus {
  Publish = 1,
  NotPublish = 2
}

export interface QuestionAnswerDto {
  questionId: number;
  answerValue: string;
}

export interface AttachmentDto {
  fileName: string;
  filePath: string;
  fileType: string; // 'image' | 'video'
  fileSize: number;
}

export interface ViolationDto {
  id: number;
  violationType: ViolationType; // 1=Public, 2=Private
  acceptanceStatus: AcceptanceStatus; // 1=Pending, 2=Approved, 3=Rejected
  publishStatus: PublishStatus; // 1=Publish, 2=NotPublish
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  violationDate: Date;
  location: string;
  description: string;
  isWitness: boolean;
  contactPreference?: string; // 'email' | 'phone' | 'both' | 'none'
  email?: string;
  phone?: string;
  personalInfoVisible: boolean;
  personalInfo?: string; // JSON string
  questionAnswers: QuestionAnswerDto[];
  attachments: AttachmentDto[];
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
  // Populated fields
  city?: CityDto;
  category?: CategoryDto;
  subCategory?: SubCategoryDto;
  createdByUser?: UserDto;
}

export interface AddPublicViolationDto {
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  violationDate: Date | string;
  location: string;
  description: string;
  isWitness: boolean;
  contactPreference?: string;
  email?: string;
  phone?: string;
  personalInfoVisible: boolean;
  personalInfo?: string; // JSON string
  questionAnswers: QuestionAnswerDto[];
  attachments: AttachmentDto[];
}

export interface AddPrivateViolationDto {
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  violationDate: Date | string;
  location: string;
  description: string;
  isWitness: boolean;
  questionAnswers: QuestionAnswerDto[];
  attachments: AttachmentDto[];
}

export interface UpdatePublicViolationDto {
  id: number;
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  violationDate: Date | string;
  location: string;
  description: string;
  isWitness?: boolean;
  contactPreference?: string;
  email?: string;
  phone?: string;
  personalInfoVisible: boolean;
  personalInfo?: string; // JSON string
  questionAnswers: QuestionAnswerDto[];
  attachments: AttachmentDto[];
}

export interface UpdatePrivateViolationDto {
  id: number;
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  violationDate: Date | string;
  location: string;
  description: string;
  isWitness?: boolean;
  questionAnswers: QuestionAnswerDto[];
  attachments: AttachmentDto[];
}

// Legacy interface for backward compatibility
export interface UpdateViolationDto extends UpdatePrivateViolationDto {}

export interface ViolationFilter {
  violationType?: ViolationType;
  acceptanceStatus?: AcceptanceStatus;
  publishStatus?: PublishStatus;
  cityId?: number;
  categoryId?: number;
  subCategoryId?: number;
  startDate?: Date | string;
  endDate?: Date | string;
}

// Helper functions
export function getViolationTypeLabel(type: ViolationType): string {
  const labels: { [key: number]: string } = {
    1: 'عام',
    2: 'خاص'
  };
  return labels[type] || 'غير معروف';
}

export function getAcceptanceStatusLabel(status: AcceptanceStatus): string {
  const labels: { [key: number]: string } = {
    1: 'قيد المراجعة',
    2: 'موافق عليه',
    3: 'مرفوض'
  };
  return labels[status] || 'غير معروف';
}

export function getPublishStatusLabel(status: PublishStatus): string {
  const labels: { [key: number]: string } = {
    1: 'منشور',
    2: 'غير منشور'
  };
  return labels[status] || 'غير معروف';
}

// Legacy interface for backward compatibility (if needed)
export interface Violation extends ViolationDto {}
