// Public Violation Type Enum
export enum PublicViolationType {
  Victim = 1,
  Witness = 2
}

// Violation Verification Status Enum
export enum ViolationVerificationStatus {
  NotVerified = 1,
  Verified = 2
}

// Violation Publish Status Enum (reusing from violation.model.ts but keeping for clarity)
export enum ViolationPublishStatus {
  Publish = 1,
  NotPublish = 2
}

export interface PublicViolationAttachmentInputDto {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
}

export interface PublicViolationAttachmentDto {
  id: number;
  publicViolationId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

// Gender enum for public violation (optional)
export enum Gender {
  Male = 1,
  Female = 2
}

export interface AddPublicViolationDto {
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  perpetratorTypeId?: number;
  violationType: PublicViolationType; // Victim=1, Witness=2
  gender?: Gender;
  violationDate: Date | string;
  address: string;
  description: string;
  publishDescription?: string;
  canContact: boolean;
  email?: string;
  phoneNumber?: string;
  preferredContactMethod?: 'email' | 'phone';
  attachments: PublicViolationAttachmentInputDto[];
}

export interface UpdatePublicViolationDto {
  id: number;
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  perpetratorTypeId?: number;
  violationType: PublicViolationType;
  violationDate: Date | string;
  address: string;
  description: string;
  canContact: boolean;
  email?: string;
  attachments: PublicViolationAttachmentInputDto[];
}

export interface PublicViolationDto {
  id: number;
  cityId: number;
  cityName?: string;
  categoryId: number;
  categoryName?: string;
  subCategoryId: number;
  subCategoryName?: string;
  perpetratorTypeId?: number;
  perpetratorTypeName?: string;
  violationType: PublicViolationType;
  gender?: Gender;
  violationDate: Date;
  address: string;
  description: string;
  publishDescription?: string;
  canContact: boolean;
  email?: string;
  phoneNumber?: string;
  preferredContactMethod?: string;
  verificationStatus: ViolationVerificationStatus;
  publishStatus: ViolationPublishStatus;
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
  attachments: PublicViolationAttachmentDto[];
}

export interface PublicViolationFilter {
  violationType?: PublicViolationType;
  verificationStatus?: ViolationVerificationStatus;
  publishStatus?: ViolationPublishStatus;
  cityId?: number;
  categoryId?: number;
  subCategoryId?: number;
  perpetratorTypeId?: number;
}

// Helper functions
export function getPublicViolationTypeLabel(type: PublicViolationType): string {
  const labels: { [key: number]: string } = {
    1: 'المبلغ',
    2: 'شاهد'
  };
  return labels[type] || 'غير معروف';
}

export function getVerificationStatusLabel(status: ViolationVerificationStatus): string {
  const labels: { [key: number]: string } = {
    1: 'غير موثق',
    2: 'موثق'
  };
  return labels[status] || 'غير معروف';
}

export function getPublishStatusLabel(status: ViolationPublishStatus): string {
  const labels: { [key: number]: string } = {
    1: 'منشور',
    2: 'غير منشور'
  };
  return labels[status] || 'غير معروف';
}
