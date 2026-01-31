export interface ViolationFollowUpAttachmentDto {
  id: number;
  violationFollowUpId: number;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
}

export interface ViolationFollowUpDto {
  id: number;
  violationId: number;
  violationType: string; // "Private" or "Public"
  followUpStatusId: number;
  followUpStatusName?: string;
  note: string;
  createdByUserId: string;
  createdByUserName?: string;
  creationDate: Date | string;
  isActive: boolean;
  attachments?: ViolationFollowUpAttachmentDto[];
}

export interface ViolationFollowUpAttachmentInputDto {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize?: number;
}

export interface AddViolationFollowUpDto {
  violationId: number;
  violationType: string; // "Private" or "Public"
  followUpStatusId: number;
  note: string;
  attachments?: ViolationFollowUpAttachmentInputDto[];
}

export interface UpdateViolationFollowUpDto {
  id: number;
  violationId: number;
  violationType: string; // "Private" or "Public"
  followUpStatusId: number;
  note: string;
}

export interface ViolationFollowUpFilter {
  violationId?: number;
  violationType?: string;
}
