export const translations: Record<string, any> = {
  en: {
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      step: 'Step {current} of {total}',
      cost: 'Cost',
      description: 'Description',
      loading: 'Loading...',
      saving: 'Saving...',
      saved: 'Saved!',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
      na: 'N/A',
      months: 'months',
      monthsShort: 'mo',
      review: 'Review',
      details: 'Details',
      downloadPdf: 'Download PDF',
      saveChanges: 'Save Changes',
      costInCurrency: 'Cost ({currency})'
    },
    login: {
      title: 'Sign in to your account',
      subtitle: 'Partner Hub Access',
      emailPlaceholder: 'Email address',
      passwordPlaceholder: 'Password',
      signInButton: 'Sign in',
      forgotPassword: 'Forgot password?',
      error: {
        invalidCredentials: 'Invalid email or password.',
        bothFieldsRequired: 'Please enter both email and password.',
      },
      resetModal: {
        title: 'Reset Password',
        instructions: 'Enter your email address and we will send you a link to reset your password.',
        emailLabel: 'Email',
        sendButton: 'Send Reset Link',
        success: 'Check your email for the password reset link.',
        error: 'Error sending reset email. Please try again.'
      }
    },
    app: {
      copyright: '© {year} MT Production. All rights reserved.',
    },
    calculation: {
        customerName: 'Customer Name',
        projectName: 'Project Name',
        deploymentStartDate: 'Est. Start Date',
        customerNamePlaceholder: 'Enter customer name',
        projectNamePlaceholder: 'Enter project name',
        deploymentStartDatePlaceholder: 'YYYY-MM-DD',
        optionDefaultName: 'Option',
        buttons: {
            new: 'New Calculation',
            dashboard: 'Dashboard',
            exportQuotePdf: 'Export PDF',
            addOption: 'Add Option',
            addItemTo: 'Add Item to {optionName}',
            requestCreditApproval: 'Request Credit Approval',
            generatePdf: 'Generate PDF'
        },
        exportQuote: {
            title: 'Rental Quote',
            date: 'Date',
            quoteId: 'Quote ID',
            optionPrefix: 'Option'
        },
        table: {
            asset: 'Asset',
            details: 'Details',
            country: 'Country',
            term: 'Term',
            qty: 'Qty',
            monthlyCost: 'Monthly Cost',
            monthlyBundled: 'Monthly (Bundled)',
            totalCost: 'Total Lease Cost',
            totalBundled: 'Total (Bundled)',
            actions: 'Actions',
            os: 'OS',
            condition: 'Condition',
            nonReturn: 'Non-Return',
            servicesLabel: 'Services',
            unit: 'unit'
        },
        wizard: {
            title: 'Add New Item',
            step1: { title: 'Asset Selection' },
            step2: { title: 'Services & Options', description: 'Configure services for this item', otherServiceDescription: 'Other Custom Service', otherServicePlaceholder: 'e.g. Special Configuration' },
            step3: { title: 'Terms & Quantity', summaryTitle: 'Item Summary', asset: 'Asset', quantity: 'Quantity', totalUnitCost: 'Total Unit Cost', leaseTerm: 'Lease Term' },
            assetType: 'Asset Type',
            brand: 'Brand',
            os: 'Operating System',
            osPlaceholder: 'Operating System',
            condition: 'Condition',
            country: 'Location / Country',
            selectCountry: 'Select Country',
            hardwareCost: 'Hardware Cost ({currency})',
            quantity: 'Quantity',
            nonReturnOption: 'Non-Return Option (Flex)',
            submitButton: 'Add to Quote',
            customDescriptionLabel: 'Custom Description',
            customDescriptionPlaceholder: 'e.g. Docking Station, Cable...',
            errors: {
                countryRequired: 'Please select a country for the asset in Step 1.'
            }
        },
        packingServiceOption: 'Packing Service',
        packingService: 'Packing Service',
        serviceHelp: {
            Portal: 'Web-based procurement & asset management',
            Preconfiguration: 'Device imaging, tagging, and etching',
            Delivery: 'Secure logistics and delivery to desk',
            Deployment: 'On-site installation and data migration',
            Support: 'Help desk and 24h hardware swap',
            Other: 'Additional custom services'
        },
        priceView: {
            label: 'Pricing View',
            detailed: 'Detailed',
            bundled: 'Bundled'
        },
        empty: {
            description: 'No items added. Click "Add Item" to start.'
        },
        error: {
            cannotDeleteLastOption: 'You cannot delete the last option.'
        },
        confirm: {
            deleteOption: 'Are you sure you want to delete this option?'
        },
        lockedBanner: 'Quote is {status}. Editing is disabled.',
        lockedBannerTooltip: 'This quote has been submitted or approved.',
        creditRequestAdminTooltip: 'Admins cannot request credit approval. Log in as a Partner to test this workflow.'
    },
    summary: {
        hardwareValue: 'Hardware Value',
        oneTimeServices: 'One-Time Services',
        totalMonthlyCost: 'Total Monthly Payment',
        totalLeaseCost: 'Total Contract Value',
        totalMonthlyBundled: 'Total Monthly (Bundled)',
        totalBundledCost: 'Total Contract (Bundled)'
    },
    creditModal: {
        multiCountryTitle: 'Credit Approval Request',
        modeIndividual: 'Individual Requests',
        modeConsolidated: 'Consolidated Request',
        selectPrimary: 'Primary Country Entity',
        consolidatedNote: 'The primary country entity will be the main obligor for the contract.',
        additionalNotes: 'Additional Notes',
        additionalNotesPlaceholder: 'Enter any specific instructions or context for the credit team...',
        companyName: 'Company Name',
        vatId: 'VAT / Tax ID',
        address: 'Address',
        city: 'City',
        postalCode: 'Postal Code',
        contactPerson: 'Contact Person',
        contactName: 'Name',
        contactEmail: 'Email',
        contactPhone: 'Phone',
        creditType: 'Customer Type',
        creditTypeNew: 'New Customer',
        creditTypeExisting: 'Existing Customer',
        hub: {
            description_consolidated: 'Review the details for the countries involved in this quote. You can submit a consolidated request or individual requests.',
            itemSummary: '{count} items - Total: {value}',
            statusNeeded: 'Details Needed',
            statusComplete: 'Ready',
            enterDetailsButton: 'Enter Details',
            editDetailsButton: 'Edit Details',
            noCountryWarning: 'Warning: Some items do not have a country assigned.',
            rightsConfirmation: 'I confirm that I am authorized to request credit on behalf of the customer.',
            consolidatedButton: 'Submit Request',
            consolidatedButtonTooltip: 'Please complete details for all countries before submitting.'
        },
        form: {
            title: 'Customer Details: {country}'
        },
        ai: {
            label: 'AI Auto-Fill (Paste text or email signature)',
            placeholder: 'Paste customer details here...',
            button: 'Extract Details'
        },
        risk: {
            button: 'Check Credit Risk (AI)',
            loading: 'Analyzing...',
            low: 'Low Risk',
            medium: 'Medium Risk',
            high: 'High Risk',
            disclaimer: 'AI estimate based on public data. Not a formal credit rating.'
        },
        error: {
            missingFields: 'Please fill in the following required fields: {fields}'
        }
    },
    dashboard: {
        title: 'Quote Dashboard',
        tabs: { quotes: 'Saved Quotes', templates: 'Templates' },
        searchPlaceholder: 'Search quotes...',
        loadByIdPlaceholder: 'Load by ID',
        loadButton: 'Load',
        refreshTooltip: 'Refresh List',
        allStatuses: 'All Statuses',
        noQuotesFound: 'No quotes found matching criteria.',
        noTemplatesFound: 'No templates found.',
        useTemplateButton: 'Use',
        confirmDeleteQuote: 'Delete this quote?',
        confirmDeleteTemplate: 'Delete this template?',
        projectFromTemplate: '{templateName} Project',
        untitledCustomer: 'Untitled Customer',
        untitledProject: 'Untitled Project',
        decisionNote: 'View Decision Note',
        itemCount: '{opts} Opts, {items} Items',
        table: {
            customerProject: 'Customer / Project',
            lastUpdated: 'Updated',
            assets: 'Assets',
            value: 'Value',
            status: 'Status',
            actions: 'Actions'
        },
        actions: { open: 'Open', copy: 'Copy', delete: 'Delete' },
        errors: {
            quoteNotFound: 'Quote with ID {id} not found in loaded list. Try refreshing.'
        }
    },
    admin: {
        tabs: { dashboard: 'Dashboard' },
        users: {
            title: 'User Management',
            export: 'Export CSV',
            searchPlaceholder: 'Search users...',
            addUserButton: 'Add User',
            table: { name: 'Name', emailCompany: 'Email / Org', country: 'Country', role: 'Role', actions: 'Actions' },
            noData: 'No users found.',
            confirmDelete: 'Delete user {email}?',
            modal: {
                editTitle: 'Edit User',
                addTitle: 'Add User',
                name: 'Name',
                email: 'Email',
                password: 'Password',
                resetPassword: 'Set New Password',
                passwordPlaceholderEdit: 'Leave blank to keep current',
                forceResetNote: 'User will be prompted to change password on next login (Not implemented)',
                role: 'Role',
                selectRole: 'Select Role',
                organization: 'Organization',
                selectOrganization: 'Select Organization',
                phone: 'Phone',
                country: 'Country',
                selectCountry: 'Select Country',
                partnerDetailsTitle: 'Partner Details',
                noOrganization: 'No Organization'
            },
            managedCountries: 'Managed Countries',
            error: {
                fillRequiredFields: 'Please fill all required fields.',
                passwordRequired: 'Password is required for new users.'
            }
        },
        lrf: {
            title: 'Lease Rate Factors',
            scope: {
                label: 'Configuration Scope',
                globalDescription: 'Editing Global Base Rates & Defaults. These apply if no country override exists.',
                countryDescription: 'Editing Overrides for {country}. Clear values to inherit Global defaults.'
            },
            upload: {
                button: 'Upload CSV',
                success: 'Successfully updated {count} factors.',
                error: { noData: 'No valid data found in CSV.' }
            },
            resetScope: {
                global: 'Reset Global',
                country: 'Reset Country',
                modalTitle: 'Reset Configuration',
                description: 'Select which settings to reset to default/inherit.',
                options: { factors: 'Rate Factors', services: 'Service Costs', settings: 'Settings' },
                button: 'Confirm Reset',
                success: 'Configuration reset successfully.'
            },
            globalSettings: {
                title: 'Global Settings',
                nonReturnUpliftHelp: 'Base uplift for non-return option'
            },
            notifications: {
                title: 'Notifications',
                description: 'Select admin to receive update requests.',
                recipientLabel: 'Recipient'
            },
            allUsedAssets: 'All Used Assets',
            table: {
                categoryOsBrand: 'Category / OS / Brand',
                termMonths: '{term} Months',
                platformDefaults: 'Platform Defaults',
                brandOverrides: 'Brand Overrides'
            }
        },
        activityLog: {
            title: 'Activity Log',
            noActivity: 'No activity recorded.',
            table: { date: 'Date', user: 'User', activity: 'Activity', details: 'Details' },
            activities: {
                QuoteCreated: 'Quote Created',
                QuoteUpdated: 'Quote Updated',
                CreditRequestSent: 'Credit Request',
                CreditDecisionApproved: 'Approved',
                CreditDecisionRejected: 'Rejected'
            }
        },
        dashboard: {
            title: 'Overview',
            totalActiveQuotes: 'Active Quotes',
            pendingApprovals: 'Pending Approvals',
            totalVolume: 'Total Volume (Est)',
            topPartners: 'Top Partners',
            table: { partner: 'Partner', quotes: 'Quotes', volume: 'Volume' }
        },
        creditInbox: {
            title: 'Credit Decision Inbox',
            views: { pending: 'Pending Requests', history: 'Decision History' },
            noPending: 'No pending requests.',
            table: { submitted: 'Submitted', partner: 'Partner', customer: 'Customer', value: 'Value', actions: 'Actions' },
            modal: {
                title: 'Credit Decision',
                tabs: { decision: 'Decision', details: 'Quote Details', customer: 'Customer Info' },
                labels: { totalRequested: 'Total Requested', hardware: 'Hardware', services: 'Services', requesterNotes: 'Requester Notes', partner: 'Partner', submitted: 'Submitted', approvedLimit: 'Approved Credit Limit', deploymentStart: 'Start Date' },
                notesLabel: 'Decision Notes',
                notesPlaceholder: 'Enter notes for the partner...',
                approve: 'Approve',
                reject: 'Reject',
                requestInfo: 'Request More Info',
                customerInfo: { company: 'Company', vatId: 'VAT ID', address: 'Address', contact: 'Contact' }
            },
            readOnlyPermission: 'You have read-only access to this request.',
            noDetails: 'No customer details available.'
        },
        branding: {
            title: 'Branding',
            appLogo: 'Application Logo',
            subLogo: 'Sub-Logo (Powered By)',
            currentLogo: 'Current',
            uploadNewLabel: 'Upload New',
            uploadButton: 'Choose Image',
            uploadHint: 'Recommended: PNG, transparent background.',
            confirmRemoveLogo: 'Are you sure you want to remove this logo?'
        },
        partners: {
            title: 'Partner Organizations',
            add: 'Add Organization',
            edit: 'Edit Organization',
            table: { name: 'Name', country: 'Country', commission: 'Comm. %', actions: 'Actions' },
            noData: 'No organizations found.',
            modal: {
                name: 'Organization Name',
                country: 'Country',
                selectCountry: 'Select Country',
                commission: 'Commission %',
                commissionHelp: 'Default commission for users in this org.',
                logo: 'Logo',
                upload: 'Upload'
            },
            error: { nameRequired: 'Name is required.' }
        },
        workflow: {
            title: 'Workflow Settings',
            primaryEmail: { title: 'Primary Credit Officer', description: 'Main recipient for credit requests.' },
            currentRecipient: 'Current Active Recipient',
            substitutes: {
                title: 'Substitutes',
                description: 'Temporary recipients for specific date ranges.',
                add: 'Add Substitute',
                email: 'Email',
                startDate: 'Start Date',
                endDate: 'End Date',
                addButton: 'Add',
                status: 'Status',
                statuses: { active: 'Active', past: 'Past', upcoming: 'Upcoming' },
                error: { allFieldsRequired: 'All fields are required.' },
                confirmRemove: 'Remove this substitute?'
            }
        },
        exchangeRates: {
            title: 'Exchange Rates',
            description: 'Base Currency: EUR. Rates used for cross-currency calculations.',
            lastUpdated: 'Last Updated',
            updating: 'Updating...',
            forceUpdate: 'Force Update',
            source: 'Source: Open Exchange Rates API'
        },
        industryWacc: {
            title: 'Industry WACC Settings',
            description: 'Manage Weighted Average Cost of Capital % for different industries.',
            newIndustry: 'New Industry',
            wacc: 'WACC %',
            add: 'Add',
            confirmDelete: 'Delete industry {industry}?'
        },
        globalAssumptions: {
            title: 'Global TCO Assumptions',
            description: 'Default values for TCO calculations.',
            operationalTitle: 'Operational Costs',
            riskTitle: 'Risk & Performance'
        },
        versionHistory: { title: 'Version History' },
        loginHistory: {
            title: 'Login History',
            noHistory: 'No login history found.',
            table: { date: 'Date', user: 'User', status: 'Status', attemptEmail: 'Email Used' },
            statuses: { Success: 'Success', Failure: 'Failure' }
        }
    },
    tco: {
        title: 'TCO Analysis',
        tuning: {
            button: 'Tune Assumptions (AI)',
            modalTitle: 'AI Assumptions Tuning',
            description: 'The AI has analyzed your quote mix and industry to suggest refined assumptions.',
            noSuggestions: 'No suggestions found. Current assumptions look reasonable.',
            table: { parameter: 'Parameter', current: 'Current', suggested: 'Suggested', reasoning: 'Reasoning' },
            applyButton: 'Apply {count} Suggestions'
        },
        mobile: {
            tune: 'Tune with AI',
            pdf: 'PDF'
        },
        empty: {
            title: 'No Quote Data',
            description: 'Please create a quote in the Calculator first.'
        },
        chart: {
            title: '5-Year Cost Comparison',
            purchaseCostLabel: 'Purchase',
            leaseCostLabel: 'Lease (CHG)',
            bestValue: 'Best Value',
            cumulativeCashFlow: 'Cumulative Cash Flow (Months)',
            cashFlowPurchase: 'Purchase',
            cashFlowLease: 'Lease'
        },
        viewMode: { bar: 'Total Cost', cashflow: 'Cash Flow' },
        savingsWithLease: 'Potential Savings with Lease',
        wacc: {
            title: 'Cost of Capital',
            industry: 'Customer Industry',
            applyIndividual: 'Use Custom WACC'
        },
        assumptions: {
            title: 'Cost Assumptions',
            deploymentCost: 'Deployment / Device',
            eoldCost: 'Disposal / Device',
            supportHours: 'Support Hrs / Device / Year',
            staffRate: 'IT Staff Hourly Rate',
            failures: 'Failure Rate %',
            downtimeHours: 'Downtime Hrs / Failure',
            employeeCost: 'Employee Cost / Hour',
            residualValue: 'Residual Value %'
        },
        breakdown: { title: 'Detailed Cost Breakdown' },
        table: {
            category: 'Cost Category',
            purchase: 'Purchase',
            lease: 'Lease',
            hardwareCost: 'Hardware / Capital',
            leasePayments: 'Lease Payments',
            capitalCost: 'Cost of Capital',
            deployment: 'Deployment',
            support: 'Support & Maintenance',
            downtime: 'Downtime Impact',
            eold: 'EOL Disposal',
            residualValue: 'Residual Value (Credit)',
            totalTco: 'Total TCO',
            included: 'Included'
        },
        pdf: {
            customerLabel: 'Customer',
            projectLabel: 'Project',
            viewLabel: 'View: Operational Budget Impact',
            costBreakdown: 'Cost Breakdown (Nominal)',
            nominalTitle: 'Financial Analysis (Nominal)',
            nominalDesc: 'This comparison highlights the operational budget impact of Leasing vs Purchasing.',
            waccTitle: 'WACC & Capital Efficiency',
            waccDesc: 'Calculations use a Weighted Average Cost of Capital (WACC) of {rate}% based on the {industry} sector benchmark.'
        },
        alerts: {
            aiDisabled: 'AI features are disabled. Please configure your Gemini API key in the .env file.',
            noItems: 'Please add items to the quote before tuning assumptions.',
            aiFailed: 'Failed to get AI suggestions. Please check your API key and try again.'
        },
        industries: {
            Technology: 'Technology',
            Healthcare: 'Healthcare',
            Education: 'Education',
            Manufacturing: 'Manufacturing',
            Retail: 'Retail',
            Finance: 'Finance'
        },
        liability: {
            title: 'Lease Liability',
            description: 'Estimated balance sheet liability over time (IFRS 16 / ASC 842).'
        }
    },
    legal: {
        checkboxLabel: 'I agree to the',
        termsLink: 'Terms and Conditions',
        modal: { title: 'Terms and Conditions', close: 'Close' },
        compliance: {
            title: 'Compliance Agreement',
            intro: 'Please review and accept the following documents to continue.',
            privacyPolicy: 'Privacy Policy',
            privacyPolicyText: 'I acknowledge the Privacy Policy.',
            dpa: 'Data Processing Agreement',
            dpaText: 'I accept the Data Processing Agreement.',
            logout: 'Decline & Logout',
            acceptButton: 'Accept & Continue'
        },
        superuser: {
            title: 'Regional Manager Agreement',
            intro: 'As a Regional Manager, you have access to sensitive data. Please accept:',
            privacyPolicy: 'Privacy Policy',
            privacyPolicyText: 'I acknowledge the Privacy Policy.',
            dpa: 'Data Processing Agreement',
            dpaText: 'I accept the DPA.',
            logout: 'Logout',
            acceptButton: 'Accept'
        },
        viewDocument: 'View Document'
    },
    guide: {
        title: 'User Guide',
        sections: {
            intro: { title: 'Introduction', content: 'Welcome to the Partner Hub.' },
            calculator: { title: 'Calculator', content: 'Use the calculator to create quotes.' },
            tco: { title: 'TCO Analysis', content: 'Compare Lease vs Buy.' },
            credit: { title: 'Credit Requests', content: 'Submit quotes for approval.' }
        }
    },
    password: {
        changeTitle: 'Change Password',
        changeSubtitle: 'Please update your password.',
        newPassword: 'New Password',
        confirmNewPassword: 'Confirm New Password',
        updatePasswordButton: 'Update Password',
        recoveryTitle: 'Reset Password',
        recoverySubtitle: 'Enter your new password below.',
        resetAndLogin: 'Reset & Login',
        resetSuccess: 'Password updated successfully.',
        error: {
            mismatch: 'Passwords do not match.',
            minLength: 'Must be at least 10 characters.',
            lowercase: 'Need lowercase letter.',
            uppercase: 'Need uppercase letter.',
            number: 'Need number.',
            specialChar: 'Need special char.'
        }
    },
    aiSummary: {
        button: 'AI Summary',
        modalTitle: 'AI Quote Summary',
        loadingText: 'Generating summary...',
        copyButton: 'Copy Text',
        copied: 'Copied!'
    },
    aiPrompt: {
        summary: {
            task: 'Write a professional executive summary for this IT hardware rental quote.',
            customer: 'Customer',
            project: 'Project',
            optionsSummary: 'Assets',
            instructionsTitle: 'Instructions',
            instructionSales1: 'Highlight the benefits of the rental model (OpEx vs CapEx, flexibility).',
            instructionSales2: 'Mention the lifecycle services (deployment, disposal) included.',
            instruction4WithTco: 'Briefly mention TCO savings if applicable.',
            languageInstruction: 'Write the response in {languageName} ({languageCode}).'
        }
    },
    pdf: {
        customerDetails: {
            title: 'Customer Details'
        }
    },
    enums: {
        AssetType: { Laptop: 'Laptop', Desktop: 'Desktop', Mobile: 'Mobile', Tablet: 'Tablet', 'Other IT': 'Other IT', Accessory: 'Accessory' },
        Brand: { HP: 'HP', Dell: 'Dell', Lenovo: 'Lenovo', Apple: 'Apple', Samsung: 'Samsung', Microsoft: 'Microsoft', Other: 'Other' },
        OperatingSystem: { Windows: 'Windows', MacOS: 'macOS', Chrome: 'ChromeOS', Android: 'Android', iOS: 'iOS', Linux: 'Linux', None: 'None' },
        Condition: { New: 'New', 'Used Grade A': 'Used (Grade A)', 'Used Grade B': 'Used (Grade B)' }
    }
  }
};
