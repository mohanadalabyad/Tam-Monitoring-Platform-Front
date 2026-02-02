import { PrivateViolationFilter } from './violation.model';
import { PublicViolationFilter } from './public-violation.model';

export interface ExportColumnDefinition {
  key: string;
  label: string;
  group: string;
}

export interface ExportViolationRequest {
  violationType: 'Private' | 'Public';
  selectedColumnKeys: string[];
  includeAttachmentsSheet: boolean;
  includeFollowUpsSheet: boolean;
  privateFilter?: PrivateViolationFilter;
  publicFilter?: PublicViolationFilter;
}
