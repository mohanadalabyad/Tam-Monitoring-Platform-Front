export interface EducationLevelDto {
  id: number;
  name: string;
  isActive: boolean;
  creationDate: Date;
  modificationDate?: Date;
  deletionDate?: Date;
  isDeleted: boolean;
  createdBy?: string;
  modifiedBy?: string;
}

export interface AddEducationLevelDto {
  name: string;
}

export interface UpdateEducationLevelDto {
  id: number;
  name: string;
}

export interface EducationLevelFilter {
  name?: string;
  isActive?: boolean;
}
