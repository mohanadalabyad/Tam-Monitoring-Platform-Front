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
  /** Include question-answer columns for the selected category (Private only; requires category in filter). */
  includeQuestionAnswers?: boolean;
  /** Include TestimonyContent and TestimonyFileLinks columns (Private only). */
  includeTestimonyContent?: boolean;
  privateFilter?: PrivateViolationFilter;
  publicFilter?: PublicViolationFilter;
}
