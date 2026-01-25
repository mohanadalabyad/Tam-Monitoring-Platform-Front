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

export interface AddPublicViolationDto {
  cityId: number;
  categoryId: number;
  subCategoryId: number;
  violationType: PublicViolationType; // Victim=1, Witness=2
  violationDate: Date | string;
  address: string;
  description: string;
  canContact: boolean;
  email?: string;
  attachments: PublicViolationAttachmentInputDto[];
}

export interface UpdatePublicViolationDto {
  id: number;
  cityId: number;
  categoryId: number;
  subCategoryId: number;
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
  violationType: PublicViolationType;
  violationDate: Date;
  address: string;
  description: string;
  canContact: boolean;
  email?: string;
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
