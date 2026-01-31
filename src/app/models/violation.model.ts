import { CityDto } from './city.model';
import { CategoryDto } from './category.model';
import { SubCategoryDto } from './subcategory.model';
import { UserDto } from './user-management.model';
import { QuestionAnswer } from './question.model';
import { PrivateViolationRole, Gender, PreferredContactMethod } from './published-violation.model';

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

// Marital Status Enum
export enum MaritalStatus {
  Married = 1,    // متزوج/ه
  Divorced = 2,   // مطلق/ه
  Widowed = 3,    // أرمل/ه
  Single = 4      // عازب/عزباء
}

// Private violation kind: استبيان vs افادات
export enum PrivateViolationKind {
  Questionnaire = 1,  // استبيان
  Testimony = 2       // افادات
}

export function getPrivateViolationKindLabel(kind: PrivateViolationKind): string {
  const labels: { [key: number]: string } = {
    1: 'استبيان',
    2: 'افادات'
  };
  return labels[kind] || 'غير محدد';
}

// Helper function to get marital status label
export function getMaritalStatusLabel(status: MaritalStatus): string {
  const labels: { [key: number]: string } = {
    1: 'متزوج/ه',
    2: 'مطلق/ه',
    3: 'أرمل/ه',
    4: 'عازب/عزباء'
  };
  return labels[status] || 'غير محدد';
}

export interface QuestionAnswerDto {
  id?: number;
  privateViolationId?: number;
  questionId: number;
  questionText?: string;
  questionType?: number;
  answerValue: string;
  isActive?: boolean;
  creationDate?: Date;
  createdBy?: string;
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
  kind: PrivateViolationKind;
  testimonyContent?: string;
  violationDate: Date | string;
  location: string;
  description?: string;
  // Personal/Victim Information
  personalName?: string;
  personalCityId?: number;
  personalAddress?: string;
  personalAge?: number;
  personalDateOfBirth?: Date | string;
  personalEducationId?: number;
  hasDisability?: boolean;
  disabilityType?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  work?: string;
  // Contact Information
  contactEmail?: string;
  contactPhone?: string;
  canBeContacted?: boolean;
  contactName?: string;
  contactAddress?: string;
  preferredContactMethod?: PreferredContactMethod;
  // Role
  role: PrivateViolationRole;
  otherRoleText?: string;
  // Publish Settings
  showPersonalInfoInPublish: boolean;
  // Question Answers
  questionAnswers: QuestionAnswerDto[];
  // Attachments
  attachments: PrivateViolationAttachmentInputDto[];
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
  kind: PrivateViolationKind;
  testimonyContent?: string;
  violationDate: Date | string;
  location: string;
  description?: string;
  publishDescription?: string;
  // Personal/Victim Information
  personalName?: string;
  personalCityId?: number;
  personalAddress?: string;
  personalAge?: number;
  personalDateOfBirth?: Date | string;
  personalEducationId?: number;
  hasDisability?: boolean;
  disabilityType?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  work?: string;
  // Contact Information
  contactEmail?: string;
  contactPhone?: string;
  canBeContacted?: boolean;
  contactName?: string;
  contactAddress?: string;
  preferredContactMethod?: PreferredContactMethod;
  // Role
  role: PrivateViolationRole;
  otherRoleText?: string;
  // Publish Settings
  showPersonalInfoInPublish: boolean;
  // Question Answers
  questionAnswers: QuestionAnswerDto[];
  // Attachments
  attachments: PrivateViolationAttachmentInputDto[];
}

// Legacy interface for backward compatibility
export interface UpdateViolationDto extends UpdatePrivateViolationDto {}

// Private Violation DTO (matching backend PrivateViolationDto)
export interface PrivateViolationDto {
  id: number;
  cityId: number;
  cityName?: string;
  categoryId: number;
  categoryName?: string;
  subCategoryId: number;
  subCategoryName?: string;
  kind?: PrivateViolationKind;
  testimonyContent?: string;
  violationDate: Date | string;
  location: string;
  description?: string;
  publishDescription?: string;
  // Personal/Victim Information
  personalName?: string;
  personalCityId?: number;
  personalCityName?: string;
  personalCity?: string; // Legacy field for backward compatibility
  personalAddress?: string;
  personalAge?: number;
  personalDateOfBirth?: Date | string;
  personalEducationId?: number;
  personalEducationName?: string;
  hasDisability?: boolean;
  disabilityType?: string;
  gender?: Gender;
  maritalStatus?: MaritalStatus;
  work?: string;
  // Contact Information
  contactEmail?: string;
  contactPhone?: string;
  canBeContacted?: boolean;
  contactName?: string;
  contactAddress?: string;
  preferredContactMethod?: PreferredContactMethod;
  // Role
  role: PrivateViolationRole;
  otherRoleText?: string;
  // Publish Settings
  showPersonalInfoInPublish: boolean;
  // Created By
  createdByUserId?: string;
  createdByUserName?: string;
  // Status
  acceptanceStatus: AcceptanceStatus;
  publishStatus: PublishStatus;
  // Question Answers
  questionAnswers: QuestionAnswerDto[];
  // Attachments
  attachments: PrivateViolationAttachmentDto[];
  // Base entity fields
  isActive: boolean;
  creationDate: Date | string;
  createdBy?: string;
}

// Private Violation Attachment DTOs
export interface PrivateViolationAttachmentInputDto {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
}

export interface PrivateViolationAttachmentDto {
  id: number;
  privateViolationId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
  isActive: boolean;
  creationDate: Date | string;
  createdBy?: string;
}

// Private Violation Filter
export interface PrivateViolationFilter {
  acceptanceStatus?: AcceptanceStatus;
  publishStatus?: PublishStatus;
  cityId?: number;
  categoryId?: number;
  subCategoryId?: number;
  createdByUserId?: string;
  kind?: PrivateViolationKind;
  gender?: number; // Gender enum from published-violation
  ageMin?: number;
  ageMax?: number;
}

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
export interface UpdateDescriptionDto {
  description?: string;
  publishDescription?: string;
}

export interface Violation extends ViolationDto {}
