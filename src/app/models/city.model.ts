export interface CityDto {
  id: number;
  name: string;
  area: string; // JSON polygon string
  governorate: string;
  isActive: boolean;
  creationDate: Date;
  createdBy?: string;
}

export interface AddCityDto {
  name: string;
  area: string; // JSON polygon string
  governorate: string;
}

export interface UpdateCityDto {
  id: number;
  name: string;
  area: string; // JSON polygon string
  governorate: string;
}

export interface CityFilter {
  name?: string;
  governorate?: string;
  isActive?: boolean;
}
