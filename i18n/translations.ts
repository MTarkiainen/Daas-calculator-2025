import { enTranslations } from './enTranslations'; // Self-referential for structure if needed, but here we define it inline.

// 1. Helper for Deep Merging
function deepMerge(base: any, update: any): any {
  if (!update) return base;
  const result = { ...base };
  for (const key in update) {
    if (Object.prototype.hasOwnProperty.call(update, key)) {
      if (
        typeof update[key] === 'object' && 
        update[key] !== null && 
        !Array.isArray(update[key]) && 
        base[key]
      ) {
        result[key] = deepMerge(base[key], update[key]);
      } else {
        result[key] = update[key];
      }
    }
  }
  return result;
}

// 2. Base English Translations (The Source of Truth)
const baseEnglish = {
  common: {
    save: "Save",
    saving: "Saving...",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    back: "Back",
    next: "Next",
    step: "Step {current} of {total}",
    close: "Close",
    loading: "Loading...",
    na: "N/A",
    yes: "Yes",
    no: "No",
    months: "Months",
    monthsShort: "mo",
    saved: "Saved",
    saveChanges: "Save Changes",
    cost: "Cost",
    description: "Description",
    costInCurrency: "Cost ({currency})",
    copy: "Copy",
    copied: "Copied!"
  },
  login: {
    title: "Sign in to your account",
    subtitle: "Partner Portal",
    emailPlaceholder: "Email address",
    passwordPlaceholder: "Password",
    forgotPassword: "Forgot password?",
    signInButton: "Sign in",
    error: {
      bothFieldsRequired: "Both email and password are required.",
      invalidCredentials: "Invalid email or password."
    },
    resetModal: {
      title: "Reset Password",
      instructions: "Enter your email address and we'll send you a link to reset your password.",
      emailLabel: "Email address",
      sendButton: "Send Reset Link",
      success: "Check your email for the password reset link.",
      error: "Error sending reset email. Please try again."
    }
  },
  admin: {
    users: {
      title: "User Management",
      addUserButton: "Add User",
      error: {
        fillRequiredFields: "Please fill in all required fields.",
        passwordRequired: "Password is required for new users.",
        createUserFailed: "Failed to create auth user",
        createProfileFailed: "Auth user created, but profile failed",
        emailExists: "A user with this email address already exists.",
        userExistsGeneric: "User creation failed. This email is likely already registered in the system."
      },
      userCreationNote: "User created successfully.",
      table: {
          name: "Name",
          emailCompany: "Email / Company",
          country: "Country",
          role: "Role",
          actions: "Actions"
      },
      modal: {
          addTitle: "Add New User",
          editTitle: "Edit User",
          name: "Full Name",
          email: "Email Address",
          password: "Password",
          resetPassword: "Reset Password",
          passwordPlaceholderEdit: "Leave blank to keep current",
          forceResetNote: "Entering a value here will change the user's password immediately.",
          role: "Role",
          selectRole: "Select Role",
          partnerDetailsTitle: "Partner Details",
          organization: "Partner Organization",
          selectOrganization: "Select Organization",
          noOrganization: "No Organization",
          phone: "Phone Number",
          country: "Country",
          selectCountry: "Select Country",
          managedCountries: "Managed Countries"
      },
      confirmDelete: "Are you sure you want to delete user {email}?"
    },
    partners: { title: "Partners", add: "Add Partner", table: { name: "Name", country: "Country", commission: "Commission", actions: "Actions" }, noData: "No partners found", modal: { name: "Organization Name", country: "Country", selectCountry: "Select Country", commission: "Commission (%)", commissionHelp: "Default markup for this partner", logo: "Logo", upload: "Upload Logo" }, error: { nameRequired: "Organization name is required" }, edit: "Edit Partner" },
    lrf: { title: "Lease Rate Factors", upload: { button: "Upload CSV", success: "Uploaded {count} factors.", error: { noData: "No valid data found in CSV." } }, scope: { label: "Scope", globalDescription: "Editing Global Base Rates (Default)", countryDescription: "Editing Overrides for {country}" }, globalSettings: { title: "Global Settings", nonReturnUpliftHelp: "Extra margin for non-return" }, notifications: { title: "Notifications", description: "Configure email alerts" }, table: { categoryOsBrand: "Category / OS / Brand", termMonths: "{term} Months" }, allUsedAssets: "All Used Assets" },
    branding: { title: "Branding", appLogo: "Application Logo", currentLogo: "Current Logo", uploadNewLabel: "Upload New Logo", uploadButton: "Upload", uploadHint: "Recommended: PNG or SVG, max 2MB", confirmRemoveLogo: "Are you sure you want to remove the custom logo?" },
    workflow: { title: "Workflow Settings", primaryEmail: { title: "Primary Credit Approval Email", description: "Default recipient for credit requests" }, currentRecipient: "Current Active Recipient", substitutes: { title: "Substitute Approvers", description: "Temporary overrides for out-of-office periods", add: "Add Substitute", email: "Email", startDate: "Start Date", endDate: "End Date", addButton: "Add", confirmRemove: "Remove this substitute?", statuses: { active: "Active", past: "Past", upcoming: "Upcoming" }, error: { allFieldsRequired: "All fields are required" } } },
    industryWacc: { title: "Industry WACC", description: "Manage Weighted Average Cost of Capital by industry", newIndustry: "New Industry", wacc: "WACC (%)", add: "Add", confirmDelete: "Delete industry {industry}?" },
    loginHistory: { title: "Login History", table: { date: "Date", user: "User", status: "Status", attemptedEmail: "Attempted Email" }, statuses: { Success: "Success", Failure: "Failure" }, noHistory: "No login history found." },
    activityLog: { title: "Activity Log", table: { date: "Date", user: "User", activity: "Activity", details: "Details" }, noActivity: "No activity recorded.", activities: { CreditRequestSent: "Credit Request Sent", UserCreated: "User Created", UserUpdated: "User Updated", UserDeleted: "User Deleted", RatesUpdated: "Rates Updated", AgreementsAccepted: "Agreements Accepted" } },
    creditInbox: { title: "Credit Inbox", noPending: "No pending credit requests.", table: { date: "Date", partner: "Partner", customer: "Customer", value: "Value", actions: "Actions" }, modal: { title: "Credit Request Decision", notesLabel: "Decision Notes", notesPlaceholder: "Add notes about the decision...", reject: "Reject", approve: "Approve", requestInfo: "Request More Info" } }
  },
  calculation: {
      customerName: "Customer Name",
      customerNamePlaceholder: "e.g. Acme Corp",
      projectName: "Project Name",
      projectNamePlaceholder: "e.g. IT Refresh 2024",
      expectedStartDate: "Expected Start Date",
      priceView: { label: "Price View", detailed: "Detailed", bundled: "Bundled" },
      buttons: { dashboard: "Dashboard", new: "New Quote", exportQuotePdf: "Export PDF", saveTemplate: "Save Template", addItemTo: "Add Item to {optionName}", requestCreditApproval: "Request Approval", generatePdf: "Generate PDF", addOption: "Add Option" },
      removeOption: "Remove Option",
      confirm: { deleteOption: "Are you sure you want to delete this option?" },
      error: { cannotDeleteLastOption: "Cannot delete the last option.", templateNameAndItemsRequired: "Template name and items are required." },
      templateModal: { title: "Save as Template", nameLabel: "Template Name", namePlaceholder: "e.g. Standard Developer Setup", saveButton: "Save Template" },
      exportQuote: { title: "Quotation", date: "Date", quoteId: "Quote ID" },
      table: { asset: "Asset", details: "Details", term: "Term", qty: "Qty", monthlyCost: "Monthly Cost", totalCost: "Total Cost", monthlyBundled: "Monthly (Bundled)", totalBundled: "Total (Bundled)", actions: "Actions", country: "Country", os: "OS", condition: "Condition", nonReturn: "Non-Return", servicesLabel: "Services", unit: "unit" },
      packingService: "Packing Service",
      packingServiceOption: "Packing Service",
      disclaimer: "Figures are indicative estimates only.",
      exchangeRateDisclaimer: "Values converted to quote currency.",
      actions: { duplicate: "Duplicate", edit: "Edit", remove: "Remove" },
      empty: { description: "No items in this option. Add items to get started." },
      wizard: { title: "Add Item", step1: { title: "Asset Selection" }, step2: { title: "Services & Config", description: "Add services and configuration", supportHelpText: "24h swap support included", otherServiceDescription: "Other / Custom Service", otherServicePlaceholder: "Service Description" }, step3: { title: "Lease Terms", summaryTitle: "Item Summary", asset: "Asset", quantity: "Quantity", totalUnitCost: "Total Unit Cost (One-time)", leaseTerm: "Lease Term" }, assetType: "Asset Type", brand: "Brand", os: "Operating System", condition: "Condition", country: "Country", selectCountry: "Select Country", customDescriptionLabel: "Description", customDescriptionPlaceholder: "Item details", hardwareCost: "Hardware Cost ({currency})", quantity: "Quantity", nonReturnOption: "Non-Return Option (5%)", packingServiceOption: "Packing Service", submitButton: "Add to Quote", leaseTerm: "Lease Term" },
      editModal: { title: "Edit Item" },
      creditRequestAdminTooltip: "Admins cannot submit credit requests."
  },
  dashboard: { title: "Quote Dashboard", tabs: { quotes: "Quotes", templates: "Templates" }, refreshTooltip: "Refresh Data", searchPlaceholder: "Search...", allStatuses: "All Statuses", loadByIdPlaceholder: "Quote ID", loadButton: "Load", table: { customerProject: "Customer / Project", lastUpdated: "Last Updated", assets: "Assets", value: "Value", status: "Status", actions: "Actions" }, untitledCustomer: "Untitled Customer", untitledProject: "Untitled Project", decisionNote: "View Decision Note", actions: { open: "Open", copy: "Copy", delete: "Delete" }, useTemplateButton: "Use Template", noQuotesFound: "No quotes found.", noTemplatesFound: "No templates found.", confirmDeleteQuote: "Are you sure you want to delete this quote?", confirmDeleteTemplate: "Are you sure you want to delete this template?", projectFromTemplate: "{templateName} Project" },
  tco: { title: "TCO Analysis", tuning: { button: "Tune Assumptions", modalTitle: "AI Tuning Suggestions", description: "Select suggestions to apply to your TCO settings.", noSuggestions: "No suggestions available.", applyButton: "Apply {count} Suggestions", table: { parameter: "Parameter", current: "Current", suggested: "Suggested", reasoning: "Reasoning" } }, empty: { title: "No Data", description: "Add items to the quote to see TCO analysis." }, chart: { title: "Cost Comparison", purchaseCostLabel: "Purchase", leaseCostLabel: "Lease", bestValue: "Best Value" }, savingsWithLease: "Savings with Lease", wacc: { title: "WACC Settings", industry: "Industry", industryAverage: "Industry Average", applyIndividual: "Use Custom WACC", individualWacc: "Custom WACC (%)" }, assumptions: { title: "Cost Assumptions", deploymentCost: "Deployment Cost", eoldCost: "EOL Disposal Cost", supportHours: "IT Support (Hours/Year)", staffRate: "IT Staff Rate (/hr)", failures: "Failures (per Year)", downtimeHours: "Downtime (Hours/Failure)", employeeCost: "Employee Cost (/hr)", residualValue: "Residual Value (%)" }, breakdown: { title: "Detailed Breakdown" }, table: { category: "Cost Category", purchase: "Purchase", lease: "Lease", hardwareCost: "Hardware / Lease", leasePayments: "Lease Payments", capitalCost: "Cost of Capital", deployment: "Deployment", support: "Support & Maintenance", downtime: "Downtime Productivity Loss", eold: "End of Life Disposal", residualValue: "Residual Value", totalTco: "Total TCO" }, industries: { Technology: "Technology", Automotive: "Automotive", Banking: "Banking", HealthcarePharma: "Healthcare & Pharma", Industrialproduction: "Industrial Production", RetailConsumerGoods: "Retail & Consumer Goods", Realestate: "Real Estate", Media: "Media", SoftwareIndustry: "Software Industry", Telecommunication: "Telecommunication", TransportLogistics: "Transport & Logistics", Insurance: "Insurance", Utilities: "Utilities", Materialsindustry: "Materials Industry", PublicSector: "Public Sector" }, liability: { title: "Lease Liability Projection", description: "Estimated future lease payments by year." } },
  aiSummary: { button: "AI Summary", modalTitle: "Quote Summary", loadingText: "Generating summary with Gemini AI...", copyButton: "Copy to Clipboard", copied: "Copied!" },
  creditModal: { multiCountryTitle: "Credit Approval Request", modeIndividual: "Individual Requests", modeConsolidated: "Consolidated Request", selectPrimary: "Select Primary Entity", consolidatedNote: "The request will be filed under {country}. All items are included.", hub: { description_consolidated: "Manage details for each country below.", noCountryWarning: "Some items have no country assigned.", itemSummary: "{count} items - {value}", statusComplete: "Ready", statusNeeded: "Details Needed", editDetailsButton: "Edit Details", enterDetailsButton: "Enter Details", rightsConfirmation: "I confirm the accuracy of this data.", consolidatedButton: "Submit Consolidated Request", consolidatedButtonTooltip: "Complete all country details first." }, form: { title: "Customer Details - {country}" }, ai: { label: "AI Auto-Fill", placeholder: "Paste customer details here...", button: "Auto-Fill" }, error: { missingFields: "Missing fields: {fields}" }, companyName: "Company Name", vatId: "VAT ID", address: "Address", city: "City", postalCode: "Postal Code", contactPerson: "Contact Person", contactName: "Name", contactEmail: "Email", contactPhone: "Phone", creditType: "Credit Type", creditTypeNew: "New Customer", creditTypeExisting: "Existing Customer" },
  enums: { AssetType: { Laptop: "Laptop", Mobile: "Mobile", Tablet: "Tablet", Desktop: "Desktop", OtherIT: "Other IT", Accessory: "Accessory" }, Brand: { HP: "HP", Lenovo: "Lenovo", Dell: "Dell", Acer: "Acer", Apple: "Apple", Samsung: "Samsung", Microsoft: "Microsoft", Other: "Other" }, Condition: { New: "New", Used: "Used" }, OperatingSystem: { Windows: "Windows", MacOS: "MacOS", Chrome: "Chrome", iOS: "iOS", Android: "Android", Other: "Other" }, AdditionalService: { ProcurementPortal: "Procurement Portal", Logistics: "Logistics", PreConfiguration: "Pre-configuration", Deployment: "Deployment", Support: "Support" } },
  aiPrompt: { summary: { personaSales: "You are a sales assistant.", task: "Summarize this quote.", customer: "Customer", project: "Project", notSpecified: "Not specified", optionsSummary: "Options", instructionsTitle: "Instructions", instructionSales1: "Focus on value.", instructionSales2: "Highlight key hardware.", instruction3WithTco: "Mention TCO savings.", instruction3WithoutTco: "Mention flexibility.", instruction4WithTco: "Keep it professional.", instruction6: "No markdown.", instruction7: "Be concise.", languageInstruction: "Respond in {languageName} ({languageCode})." }, assistant: { persona: "You are a helpful assistant.", appDescription: "This app calculates IT leasing quotes.", goal: "Help the user.", languageInstruction: "Use {languageName}." } },
  pdf: { customerDetails: { title: "Customer Details" }, standardServices: { title: "Included Standard Services", invoice: { title: "Single Invoice", desc: "One consolidated invoice." }, tesma: { title: "Asset Management", desc: "Online portal access." }, eol: { title: "Secure EOL", desc: "Certified data erasure." } }, tco: { benefitsDescription: "Leasing provides financial flexibility and lifecycle services." }, serviceDescriptions: { title_benefits: "Benefits" } },
  summary: {
      totalMonthlyBundled: "Total Monthly (Bundled)",
      totalBundledCost: "Total Bundled Cost",
      hardwareValue: "Hardware Value",
      oneTimeServices: "One-Time Services",
      totalMonthlyCost: "Total Monthly Cost",
      totalLeaseCost: "Total Lease Cost"
  },
  app: {
      copyright: "© {year} CHG-MERIDIAN. All rights reserved."
  },
  password: {
      changeTitle: "Change Password",
      changeSubtitle: "You must change your password.",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      updatePasswordButton: "Update Password",
      error: {
          mismatch: "Passwords do not match.",
          minLength: "Minimum 10 characters.",
          lowercase: "One lowercase letter required.",
          uppercase: "One uppercase letter required.",
          number: "One number required.",
          specialChar: "One special character required."
      },
      recoveryTitle: "Recover Password",
      recoverySubtitle: "Set a new password.",
      resetAndLogin: "Reset & Login",
      resetSuccess: "Password reset successful."
  },
  // --- EXTENSIVE LEGAL TEXTS (Fallback for all languages) ---
  legal: {
      termsLink: "Terms & Conditions",
      checkboxLabel: "I agree to the",
      viewDocument: "Read Document",
      modal: { title: "Terms and Conditions of Use", close: "Close" },
      terms: {
          header: "General Terms and Conditions of Use",
          lastUpdated: "Last Updated: October 2024",
          intro: { 
              p1: "These General Terms and Conditions of Use ('Terms') constitute a legally binding agreement between you ('User', 'you') and CHG-MERIDIAN ('Company', 'we', 'us') regarding your access to and use of the Partner Portal application.", 
              list: "By accessing the Service, you confirm your authority to bind your entity.|You agree to comply with all applicable laws.|Access is conditional upon acceptance.", 
              p2: "If you do not agree to these Terms, you are strictly prohibited from using the Service." 
          },
          sections: {
              definitions: {
                  title: "1. Definitions",
                  content: [
                      {type: 'p', text: "\"Content\" refers to text, data, lease rate factors, pricing models, algorithms, and software code."},
                      {type: 'p', text: "\"Service\" means the web application and all associated backend systems."}
                  ]
              },
              license: { 
                  title: "2. Use License", 
                  content: [
                      {type: 'p', text: "The Company grants you a limited, non-exclusive, non-transferable, revocable license to use the Service solely for internal business purposes related to authorized leasing activities."},
                      {type: 'ul', items: "Do not modify, copy, or create derivative works.|Do not use for unauthorized commercial purposes.|Do not reverse engineer the source code."}
                  ] 
              },
              confidentiality: {
                  title: "3. Confidentiality",
                  content: [
                      {type: 'p', text: "You acknowledge that the Portal contains Confidential Information including Lease Rate Factors (LRFs), pricing algorithms, and customer data."},
                      {type: 'p', text: "You agree to hold all such information in strict confidence and not to disclose it to third parties without prior written consent."}
                  ]
              },
              financial: {
                  title: "4. Financial Disclaimer",
                  content: [
                      {type: 'p', text: "All calculations, quotes, and analyses are estimates for informational purposes only and do not constitute a binding offer."},
                      {type: 'ul', items: "Final binding offers require formal credit approval.|Rates are subject to market fluctuation.|Figures exclude VAT unless stated."}
                  ]
              },
              security: {
                  title: "5. Account Security",
                  content: [
                      {type: 'p', text: "You are responsible for maintaining the confidentiality of your login credentials. You must notify us immediately of any unauthorized use of your account."}
                  ]
              },
              liability: {
                  title: "6. Limitation of Liability",
                  content: [
                      {type: 'p', text: "In no event shall the Company be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service."}
                  ]
              },
              termination: {
                  title: "7. Termination",
                  content: [
                      {type: 'p', text: "We may terminate or suspend your access immediately, without prior notice, for any conduct that we, in our sole discretion, believe breaches these Terms."}
                  ]
              },
              governing: {
                  title: "8. Governing Law",
                  content: [
                      {type: 'p', text: "These Terms shall be governed by the laws of the jurisdiction in which the Company is headquartered."}
                  ]
              },
              changes: {
                  title: "9. Changes to Terms",
                  content: [
                      {type: 'p', text: "We reserve the right to modify these Terms at any time. Continued use of the Service constitutes acceptance of the new Terms."}
                  ]
              },
              contact: {
                  title: "10. Contact",
                  content: [
                      {type: 'p', text: "For questions regarding these Terms, please contact your account manager."}
                  ]
              }
          },
          confirmation: "By logging in, you acknowledge that you have read and understood these Terms."
      },
      superuser: { 
          title: "Partner & Regional Management Agreement", 
          intro: "As a Regional Manager, you have access to sensitive data. Please accept the compliance protocols.", 
          privacyPolicy: "Data Privacy Policy", 
          privacyPolicyText: "I agree to handle customer personal data (PII) in accordance with GDPR.", 
          privacyPolicyFullText: "DATA PRIVACY POLICY\n\n1. SCOPE\nThis policy governs the handling of PII within the Partner Portal.\n\n2. OBLIGATIONS\nUsers must ensure data is processed lawfully, transparently, and for specific purposes only.\n\n3. SECURITY\nAppropriate technical measures must be taken to prevent unauthorized access.",
          dpa: "Data Processing Agreement", 
          dpaText: "I accept the terms of the Data Processing Agreement.", 
          dpaFullText: "DATA PROCESSING AGREEMENT\n\n1. DEFINITIONS\nController vs Processor roles defined.\n\n2. PROCESSING\nData shall be processed only on documented instructions.",
          logout: "Decline", 
          acceptButton: "Accept" 
      }
  }
};

// 3. Language Specific Updates (Only overrides needed)
// NOTE: We do NOT redefine the massive 'legal' object here to ensure fallback to English works.

const deUpdates = {
  common: { edit: "Bearbeiten", cancel: "Abbrechen", saving: "Speichern...", save: "Speichern", back: "Zurück", next: "Weiter", close: "Schließen", yes: "Ja", no: "Nein" },
  login: { title: "Anmelden", emailPlaceholder: "E-Mail", passwordPlaceholder: "Passwort", signInButton: "Anmelden" },
  calculation: { title: "Kalkulation", customerName: "Kunde", projectName: "Projekt" }
};

const fiUpdates = {
  common: { edit: "Muokkaa", cancel: "Peruuta", saving: "Tallennetaan...", save: "Tallenna", back: "Takaisin", next: "Seuraava", close: "Sulje", yes: "Kyllä", no: "Ei" },
  login: { title: "Kirjaudu", emailPlaceholder: "Sähköposti", passwordPlaceholder: "Salasana", signInButton: "Kirjaudu" },
  calculation: { title: "Laskelma", customerName: "Asiakas", projectName: "Projekti" }
};

const svUpdates = {
  common: { edit: "Redigera", cancel: "Avbryt", saving: "Sparar...", save: "Spara", back: "Tillbaka", next: "Nästa", close: "Stäng", yes: "Ja", no: "Nej" },
  login: { title: "Logga in", emailPlaceholder: "E-post", passwordPlaceholder: "Lösenord", signInButton: "Logga in" },
  calculation: { title: "Kalkyl", customerName: "Kund", projectName: "Projekt" }
};

const noUpdates = {
  common: { edit: "Rediger", cancel: "Avbryt", saving: "Lagrer...", save: "Lagre", back: "Tilbake", next: "Neste", close: "Lukk", yes: "Ja", no: "Nej" },
  login: { title: "Logg inn", emailPlaceholder: "E-post", passwordPlaceholder: "Passord", signInButton: "Logg inn" },
  calculation: { title: "Kalkyle", customerName: "Kunde", projectName: "Prosjekt" }
};

const daUpdates = {
  common: { edit: "Rediger", cancel: "Annuller", saving: "Gemmer...", save: "Gem", back: "Tilbage", next: "Næste", close: "Luk", yes: "Ja", no: "Nej" },
  login: { title: "Log ind", emailPlaceholder: "E-mail", passwordPlaceholder: "Adgangskode", signInButton: "Log ind" },
  calculation: { title: "Beregning", customerName: "Kunde", projectName: "Projekt" }
};

const plUpdates = {
  common: { edit: "Edytuj", cancel: "Anuluj", saving: "Zapisywanie...", save: "Zapisz", back: "Wstecz", next: "Dalej", close: "Zamknij", yes: "Tak", no: "Nie" },
  login: { title: "Zaloguj", emailPlaceholder: "E-mail", passwordPlaceholder: "Hasło", signInButton: "Zaloguj" },
  calculation: { title: "Kalkulacja", customerName: "Klient", projectName: "Projekt" }
};

const csUpdates = {
  common: { edit: "Upravit", cancel: "Zrušit", saving: "Ukládání...", save: "Uložit", back: "Zpět", next: "Další", close: "Zavřít", yes: "Ano", no: "Ne" },
  login: { title: "Přihlásit", emailPlaceholder: "E-mail", passwordPlaceholder: "Heslo", signInButton: "Přihlásit" },
  calculation: { title: "Kalkulace", customerName: "Zákazník", projectName: "Projekt" }
};

// 4. Export the Merged Translations
export const translations = {
  en: baseEnglish,
  de: deepMerge(baseEnglish, deUpdates),
  fi: deepMerge(baseEnglish, fiUpdates),
  sv: deepMerge(baseEnglish, svUpdates),
  no: deepMerge(baseEnglish, noUpdates),
  da: deepMerge(baseEnglish, daUpdates),
  pl: deepMerge(baseEnglish, plUpdates),
  cs: deepMerge(baseEnglish, csUpdates),
};