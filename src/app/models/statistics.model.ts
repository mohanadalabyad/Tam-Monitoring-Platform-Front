export interface ViolationStatisticsDto {
  totalViolations: number;
  publishedViolations: number;
  underReviewViolations: number;
  cityStatistics: CityStatisticsItemDto[];
}

export interface CityStatisticsItemDto {
  cityId: number;
  cityName?: string;
  area?: string; // GeoJSON string
  totalViolations: number;
  approvedPublishedCount: number;
}
