/**
 * Website content is keyed by module. Each module has its own shape.
 * Use these interfaces for typing where needed; otherwise Record<string, any> is fine.
 */
export type WebsiteContentMap = Record<string, unknown>;

export interface NavLinkItem {
  label: string;
  route: string;
  isReportButton?: boolean;
}

export interface HeaderContent {
  logoUrl?: string;
  navLinks?: NavLinkItem[];
}

export interface FooterQuickLink {
  label: string;
  route: string;
}

export interface FooterContent {
  orgName?: string;
  tagline?: string;
  websiteUrl?: string;
  quickLinks?: FooterQuickLink[];
  email?: string;
  phone?: string;
  address?: string;
  copyrightText?: string;
}

export interface HomeHeroContent {
  badge?: string;
  titleMain?: string;
  titleSub?: string;
  description?: string;
  primaryButtonText?: string;
  primaryButtonRoute?: string;
  secondaryButtonText?: string;
  secondaryButtonRoute?: string;
}

export interface StepItem {
  title: string;
  description: string;
}

export interface FeatureItem {
  title: string;
  description: string;
}
