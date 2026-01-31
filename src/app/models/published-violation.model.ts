import { PublicViolationType } from './public-violation.model';
import { QuestionType } from './question.model';
import { MaritalStatus, getMaritalStatusLabel } from './violation.model';

// Published Violation DTO - represents both Public and Private violations when published
export interface PublishedViolationDto {
  id: number;
  violationType: string; // "Public" or "Private"
  
  // Common fields
  cityId: number;
  cityName?: string;
  categoryId: number;
  categoryName?: string;
  subCategoryId: number;
  subCategoryName?: string;
  violationDate: Date;
  description: string;
  /** When present, show this on the public site instead of description */
  publishDescription?: string;
  
  // Public Violation specific fields
  publicViolationType?: PublicViolationType;
  address?: string;
  
  // Private Violation specific fields
  location?: string;
  role?: PrivateViolationRole;
  otherRoleText?: string;
  
  // Personal/Victim Information (only populated if ShowPersonalInfoInPublish is true for PrivateViolations)
  personalName?: string;
  personalCity?: string;
  personalAddress?: string;
  personalAge?: number;
  personalDateOfBirth?: Date;
  personalEducationId?: number;
  personalEducationName?: string;
  hasDisability?: boolean;
  disabilityType?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  work?: string;
  
  // Contact Information (only for PrivateViolations when ShowPersonalInfoInPublish)
  canBeContacted?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  preferredContactMethod?: PreferredContactMethod;
  
  // Question Answers (only for PrivateViolations)
  questionAnswers?: PublishedQuestionAnswerDto[];
  
  // Attachments
  attachments: PublishedAttachmentDto[];
  
  // Base entity fields
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

// Preferred Contact Method Enum
export enum PreferredContactMethod {
  Phone = 1,
  Email = 2
}

// Helper function for PreferredContactMethod
export function getPreferredContactMethodLabel(method: PreferredContactMethod): string {
  const labels: { [key: number]: string } = {
    1: 'هاتف',
    2: 'بريد إلكتروني'
  };
  return labels[method] || 'غير معروف';
}

export interface PublishedQuestionAnswerDto {
  questionId: number;
  questionText?: string;
  questionType?: QuestionType;
  answerValue: string;
}

export interface PublishedAttachmentDto {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
}

export interface PublishedViolationFilter {
  violationType?: string; // "Public" or "Private"
  cityId?: number;
  categoryId?: number;
  subCategoryId?: number;
  dateFrom?: string; // ISO date string
  dateTo?: string; // ISO date string
}

// Enums for Private Violation
export enum PrivateViolationRole {
  Witness = 1,
  DirectVictim = 2,
  InstitutionRepresentative = 3,
  Other = 4
}

export enum Gender {
  Male = 1,
  Female = 2
}

// Helper functions
export function getPrivateViolationRoleLabel(role: PrivateViolationRole): string {
  const labels: { [key: number]: string } = {
    1: 'شاهد',
    2: 'ضحية مباشرة',
    3: 'ممثل مؤسسة',
    4: 'أخرى'
  };
  return labels[role] || 'غير معروف';
}

export function getGenderLabel(gender: Gender): string {
  const labels: { [key: number]: string } = {
    1: 'ذكر',
    2: 'أنثى'
  };
  return labels[gender] || 'غير معروف';
}

// Re-export marital status helper for convenience
export { getMaritalStatusLabel };
