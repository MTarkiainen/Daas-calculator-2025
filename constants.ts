

import { AssetType, OperatingSystem, Brand, Condition, AdditionalService, LeaseTerm, Profile, UserRole, LeaseRateFactorsData, QuoteStatus, WorkflowSettings, TcoSettings } from './types';
import { v4 as uuidv4 } from 'uuid';

export const ASSET_TYPE_KEYS = Object.keys(AssetType) as (keyof typeof AssetType)[];
export const OPERATING_SYSTEM_KEYS = Object.keys(OperatingSystem) as (keyof typeof OperatingSystem)[];
export const BRAND_KEYS = Object.keys(Brand) as (keyof typeof Brand)[];
export const CONDITION_KEYS = Object.keys(Condition) as (keyof typeof Condition)[];
export const LEASE_TERMS: LeaseTerm[] = [12, 24, 36, 48, 60];
export const ADDITIONAL_SERVICE_KEYS = Object.keys(AdditionalService) as (keyof typeof AdditionalService)[];
export const QUOTE_STATUSES: QuoteStatus[] = Object.values(QuoteStatus);

export const RELEVANT_OS_MAP_KEYS: Partial<Record<keyof typeof AssetType, (keyof typeof OperatingSystem)[]>> = {
    Laptop: ['Windows', 'MacOS', 'Chrome', 'Other'],
    Mobile: ['iOS', 'Android', 'Other'],
    Tablet: ['iOS', 'Android', 'Chrome', 'Other'],
    Desktop: ['Windows', 'MacOS', 'Other'],
};


const adminUserId = uuidv4();
// Fix: Changed User[] to Profile[] and removed password property.
export const INITIAL_USERS: Profile[] = [
  { id: adminUserId, name: 'Admin User', email: 'admin@rentalcorp.com', role: UserRole.Admin, commissionPercentage: 0, mustChangePasswordOnNextLogin: false },
  { id: uuidv4(), name: 'Partner One', email: 'partner1@partnerco.com', role: UserRole.Partner, companyName: 'PartnerCo Inc.', phone: '+1-202-555-0171', commissionPercentage: 0.5, country: 'GB', mustChangePasswordOnNextLogin: false },
  { id: uuidv4(), name: 'Partner Two', email: 'partner2@anotherpartner.com', role: UserRole.Partner, companyName: 'Another Partner Ltd.', phone: '+1-202-555-0192', commissionPercentage: 0.7, country: 'FI', mustChangePasswordOnNextLogin: false },
];

export const USED_ASSET_LRF_KEY = 'USED_ASSET_LRF';

// LRFs have been recalculated based on specified residual values:
// Standard RVs: 12m=25%, 24m=20%, 36m=15%, 48m=10%, 60m=5%
// An interest/profit component was derived from the base asset type data and applied consistently.
export const INITIAL_LEASE_RATE_FACTORS_DATA: LeaseRateFactorsData = {
  lastUpdatedAt: new Date().toISOString(),
  updatedByUserId: adminUserId,
  notificationAdminId: adminUserId,
  nonReturnUpliftFactor: 0.008,
  packingServiceCost: 15,
  updateLog: [
    {
      timestamp: new Date().toISOString(),
      adminId: adminUserId,
      adminName: 'Admin User',
    }
  ],
  factors: {
    // Global rate for all used assets
    [USED_ASSET_LRF_KEY]: { "12": 0.0875, "24": 0.04375, "36": 0.02917, "48": 0.02188, "60": 0.0175 },
    
    // Base rates per Asset Type for NEW assets. All brands will default to these rates.
    // Specific overrides can be added in the admin panel.
    [AssetType.Laptop]:    { "12": 0.075, "24": 0.0375, "36": 0.025, "48": 0.01875, "60": 0.015 },
    [AssetType.Mobile]:    { "12": 0.075, "24": 0.0375, "36": 0.025, "48": 0.01875, "60": 0.015 },
    [AssetType.Tablet]:    { "12": 0.075, "24": 0.0375, "36": 0.025, "48": 0.01875, "60": 0.015 },
    [AssetType.Desktop]:   { "12": 0.075, "24": 0.0375, "36": 0.025, "48": 0.01875, "60": 0.015 },
    [AssetType.OtherIT]:   { "12": 0.0875, "24": 0.04375, "36": 0.02917, "48": 0.02188, "60": 0.0175 },
    [AssetType.Accessory]: { "12": 0.0875, "24": 0.04375, "36": 0.02917, "48": 0.02188, "60": 0.0175 },
  }
};

export const INITIAL_WORKFLOW_SETTINGS: WorkflowSettings = {
  primaryCreditApprovalEmail: 'credit.approval@rentalcorp.com',
  substitutes: [],
};

export const INITIAL_TCO_SETTINGS: TcoSettings = {
  selectedIndustry: "Technology",
  useCustomWacc: false,
  customWacc: 10,
  deploymentCostPerDevice: 50,
  itSupportHoursPerDeviceYear: 4,
  itStaffHourlyRate: 75,
  failuresPerDeviceYear: 0.1,
  downtimeHoursPerFailure: 8,
  employeeCostPerHour: 60,
  eoldCostPerDevice: 25,
  residualValuePercentage: 10,
};

export const BASE_HARDWARE_COSTS: Record<AssetType, number> = {
  [AssetType.Laptop]: 1200,
  [AssetType.Mobile]: 800,
  [AssetType.Tablet]: 600,
  [AssetType.Desktop]: 1000,
  [AssetType.OtherIT]: 500,
  [AssetType.Accessory]: 150,
};

export const INDUSTRIES_WACC: Record<string, number> = {
  "Automotive": 8.50,
  "Banking": 9.30,
  "Healthcare & Pharma": 8.30,
  "Industrial production": 9.35,
  "Retail & Consumer Goods": 8.15,
  "Real estate": 7.30,
  "Media": 9.05,
  "Software Industry": 10.50,
  "Technology": 9.25,
  "Telecommunication": 5.40,
  "Transport & Logistics": 9.20,
  "Insurance": 11.50,
  "Utilities": 4.95,
  "Materials industry": 8.30,
};

// FIX: Added COUNTRIES constant to resolve import errors.
export const COUNTRIES = [
    { name: 'Austria', code: 'AT' },
    { name: 'Belgium', code: 'BE' },
    { name: 'Bulgaria', code: 'BG' },
    { name: 'Croatia', code: 'HR' },
    { name: 'Cyprus', code: 'CY' },
    { name: 'Czech Republic', code: 'CZ' },
    { name: 'Denmark', code: 'DK' },
    { name: 'Estonia', code: 'EE' },
    { name: 'Finland', code: 'FI' },
    { name: 'France', code: 'FR' },
    { name: 'Germany', code: 'DE' },
    { name: 'Greece', code: 'GR' },
    { name: 'Hungary', code: 'HU' },
    { name: 'Ireland', code: 'IE' },
    { name: 'Italy', code: 'IT' },
    { name: 'Latvia', code: 'LV' },
    { name: 'Lithuania', code: 'LT' },
    { name: 'Luxembourg', code: 'LU' },
    { name: 'Malta', code: 'MT' },
    { name: 'Netherlands', code: 'NL' },
    { name: 'Norway', code: 'NO' },
    { name: 'Poland', code: 'PL' },
    { name: 'Portugal', code: 'PT' },
    { name: 'Romania', code: 'RO' },
    { name: 'Slovakia', code: 'SK' },
    { name: 'Slovenia', code: 'SI' },
    { name: 'Spain', code: 'ES' },
    { name: 'Sweden', code: 'SE' },
    { name: 'United Kingdom', code: 'GB' },
    { name: 'United States', code: 'US' },
];

export const CURRENCIES = [
  { code: 'EUR', name: 'Euro' },
  { code: 'USD', name: 'US Dollar' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'DKK', name: 'Danish Krone' },
  { code: 'NOK', name: 'Norwegian Krone' },
  { code: 'PLN', name: 'Polish Złoty' },
  { code: 'CZK', name: 'Czech Koruna' },
];

export const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  AT: 'EUR', BE: 'EUR', BG: 'EUR', HR: 'EUR', CY: 'EUR', EE: 'EUR', FI: 'EUR', FR: 'EUR', DE: 'EUR', GR: 'EUR', HU: 'EUR', IE: 'EUR', IT: 'EUR', LV: 'EUR', LT: 'EUR', LU: 'EUR', MT: 'EUR', NL: 'EUR', PT: 'EUR', RO: 'EUR', SK: 'EUR', SI: 'EUR', ES: 'EUR',
  CZ: 'CZK',
  DK: 'DKK',
  PL: 'PLN',
  SE: 'SEK',
  GB: 'GBP',
  US: 'USD',
  NO: 'NOK',
};

export const LANGUAGE_TO_COUNTRY_MAP: Record<string, string> = {
  en: 'GB',
  de: 'DE',
  fi: 'FI',
  sv: 'SE',
  no: 'NO',
  da: 'DK',
  pl: 'PL',
  cs: 'CZ',
};