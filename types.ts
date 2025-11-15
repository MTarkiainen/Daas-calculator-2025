

export enum AssetType {
  Laptop = "Laptop",
  Mobile = "Mobile",
  Tablet = "Tablet",
  Desktop = "Desktop",
  OtherIT = "Other IT",
  Accessory = "Accessory",
}

export enum OperatingSystem {
  Windows = "Windows",
  MacOS = "MacOS",
  Chrome = "Chrome",
  iOS = "iOS",
  Android = "Android",
  Other = "Other",
}

export enum Brand {
  HP = "HP",
  Lenovo = "Lenovo",
  Dell = "Dell",
  Acer = "Acer",
  Apple = "Apple",
  Samsung = "Samsung",
  Microsoft = "Microsoft",
  Other = "Other",
}

export enum Condition {
  New = "New",
  Used = "Used",
}

export enum AdditionalService {
  Deployment = "Deployment",
  PreConfiguration = "Pre-configuration (staging)",
  Delivery = "Delivery",
  Support = "Support (24h Swap)",
  PackingService = "Packing service (End of lease)",
}

export type LeaseTerm = 12 | 24 | 36 | 48 | 60;

export interface ServiceSelection {
  service: AdditionalService | 'Other';
  cost: number;
  description?: string; // For 'Other' service
}

export interface CalculationItem {
  id: string;
  assetType: AssetType;
  customDescription?: string;
  operatingSystem: OperatingSystem | null;
  brand: Brand;
  condition: Condition;
  leaseTerm: LeaseTerm;
  additionalServices: ServiceSelection[];
  hardwareCost: number;
  quantity: number;
  nonReturnPercentage?: number;
  country?: string; // NEW: Added to associate item with a country
}

export interface CartItem {
  calculationItemId: string;
  quantity: number;
}

export enum QuoteStatus {
  Draft = "Draft",
  CreditPending = "CreditPending",
  Sent = "Sent",
  Accepted = "Accepted",
  Rejected = "Rejected",
}

export interface QuoteOption {
  id: string;
  name: string;
  items: CalculationItem[];
}

// NEW: Interface for country-specific customer details
export interface CountryCustomerDetails {
  customerName?: string;
  customerAddress?: string;
  customerCity?: string;
  customerPostalCode?: string;
  customerCountry?: string;
  customerContactName?: string;
  customerContactEmail?: string;
  customerContactPhone?: string;
  customerVatId?: string;
  creditType?: 'New' | 'Existing';
}


export interface Quote {
  id: string; // UUID from Supabase
  customerName: string;
  projectName: string;
  expectedStartDate: string;
  options: QuoteOption[];
  status: QuoteStatus;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  // Deprecated global fields, will be phased out for countrySpecificDetails
  customerAddress?: string;
  customerCity?: string;
  customerPostalCode?: string;
  customerCountry?: string;
  customerContactName?: string;
  customerContactEmail?: string;
  customerContactPhone?: string;
  customerVatId?: string;
  creditType?: 'New' | 'Existing';
  currency?: string;
  // NEW: Store details for each country in a multi-country project
  countrySpecificDetails?: Record<string, Partial<CountryCustomerDetails>>;
}

export interface Template {
  id: string; // UUID from Supabase
  name: string;
  items: Omit<CalculationItem, 'id'>[];
  userId?: string;
}

export enum UserRole {
  Admin = "Admin",
  Partner = "Partner",
}

// Renamed from User to Profile to align with Supabase table
export interface Profile {
  id: string; // This is the UUID from auth.users
  name: string;
  email: string;
  role: UserRole;
  companyName?: string;
  phone?: string;
  logoBase64?: string;
  commissionPercentage?: number;
  country?: string;
  mustChangePasswordOnNextLogin?: boolean;
}

export type LeaseRateFactorsMap = Record<string, Partial<Record<LeaseTerm, number>>>;

export interface LeaseRateUpdateLogEntry {
  timestamp: string;
  adminId: string;
  adminName: string;
}

export interface LeaseRateFactorsData {
  factors: LeaseRateFactorsMap;
  lastUpdatedAt: string;
  updatedByUserId: string;
  notificationAdminId: string;
  updateLog: LeaseRateUpdateLogEntry[];
  nonReturnUpliftFactor?: number;
}

export interface TcoSettings {
  selectedIndustry: string;
  useCustomWacc: boolean;
  customWacc: number;
  deploymentCostPerDevice: number;
  itSupportHoursPerDeviceYear: number;
  itStaffHourlyRate: number;
  failuresPerDeviceYear: number;
  downtimeHoursPerFailure: number;
  employeeCostPerHour: number;
  eoldCostPerDevice: number;
  residualValuePercentage: number;
}

// Supabase will handle login attempts in its logs, this might be deprecated
export interface LoginAttempt {
  id: string;
  userId?: string;
  emailAttempt: string;
  timestamp: string;
  status: 'Success' | 'Failure';
}

export interface BrandingSettings {
  appLogoBase64: string | null;
}

export type PriceViewMode = 'detailed' | 'bundled';

export interface SubstituteRecipient {
  id: string;
  email: string;
  startDate: string;
  endDate: string;
}

export interface WorkflowSettings {
  primaryCreditApprovalEmail: string;
  substitutes: SubstituteRecipient[];
}

export enum ActivityType {
  CreditRequestSent = "CreditRequestSent",
}

export interface ActivityLogEntry {
  id: string; // UUID from Supabase
  timestamp: string;
  userId: string;
  type: ActivityType;
  details: string;
  quoteId?: string;
  customerName?: string;
}