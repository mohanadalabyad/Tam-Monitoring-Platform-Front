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
}

export interface AddViolationFollowUpDto {
  violationId: number;
  violationType: string; // "Private" or "Public"
  followUpStatusId: number;
  note: string;
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
