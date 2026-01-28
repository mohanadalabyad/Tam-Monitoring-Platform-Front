export interface FollowUpStatusDto {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  creationDate: Date | string;
  createdBy?: string;
}

export interface AddFollowUpStatusDto {
  name: string;
  description?: string;
}

export interface UpdateFollowUpStatusDto {
  id: number;
  name: string;
  description?: string;
}

export interface FollowUpStatusFilter {
  name?: string;
}
