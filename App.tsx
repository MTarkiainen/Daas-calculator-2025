



import React, { useState, useEffect, useRef } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, LeaseRateFactorsData, UserRole, Quote, TcoSettings, Template, QuoteStatus, QuoteOption, BrandingSettings, WorkflowSettings, ActivityLogEntry, ActivityType, LoginAttempt, CountryCustomerDetails } from './types';
import { INDUSTRIES_WACC, COUNTRIES, COUNTRY_CURRENCY_MAP, LANGUAGE_TO_COUNTRY_MAP, CURRENCIES } from './constants';
import CalculationSheet from './components/calculation/CalculationSheet';
import AdminSheet from './components/admin/AdminSheet';
import TcoSheet from './components/tco/TcoSheet';
import { Tabs, Tab } from './components/ui/Tabs';
import Login from './components/Login';
import { Button } from './components/ui/Button';
import ProfileModal from './components/profile/ProfileModal';
import UserCircleIcon from './components/ui/icons/UserCircleIcon';
import { v4 as uuidv4 } from 'uuid';
import InformationCircleIcon from './components/ui/icons/InformationCircleIcon';
import { supabase } from './supabaseClient';
import ForcePasswordChangeModal from './components/profile/ForcePasswordChangeModal';
import { useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './components/ui/LanguageSwitcher';
import ChevronDownIcon from './components/ui/icons/ChevronDownIcon';
import AiAssistant from './components/ai/AiAssistant';
import SparklesIcon from './components/ui/icons/SparklesIcon';

const CurrencyIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 16v-1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);


interface CurrencySwitcherProps {
    currentCurrency: string;
    onCurrencyChange: (currencyCode: string) => void;
}

const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ currentCurrency, onCurrencyChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSelectCurrency = (code: string) => {
        onCurrencyChange(code);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
                <CurrencyIcon className="w-5 h-5" />
                <span className="text-sm font-medium">{currentCurrency}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
                    <ul className="py-1 max-h-60 overflow-y-auto">
                        {CURRENCIES.map((currency) => (
                            <li key={currency.code}>
                                <button
                                    onClick={() => handleSelectCurrency(currency.code)}
                                    className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <span>{currency.name} ({currency.code})</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};


type ActiveTab = 'calculator' | 'tco' | 'admin';

const mapQuoteFromDb = (dbQuote: any): Quote => ({
  id: dbQuote.id,
  customerName: dbQuote.customer_name,
  projectName: dbQuote.project_name,
  expectedStartDate: dbQuote.expected_start_date,
  options: dbQuote.options,
  status: dbQuote.status,
  createdAt: dbQuote.created_at,
  updatedAt: dbQuote.updated_at,
  createdByUserId: dbQuote.created_by_user_id,
  customerAddress: dbQuote.customer_address,
  customerCity: dbQuote.customer_city,
  customerPostalCode: dbQuote.customer_postal_code,
  customerCountry: dbQuote.customer_country,
  customerContactName: dbQuote.customer_contact_name,
  customerContactEmail: dbQuote.customer_contact_email,
  customerContactPhone: dbQuote.customer_contact_phone,
  customerVatId: dbQuote.customer_vat_id,
  creditType: dbQuote.credit_type,
  currency: dbQuote.currency,
  countrySpecificDetails: dbQuote.country_specific_details || {},
});

const mapTemplateFromDb = (dbTemplate: any): Template => ({
  id: dbTemplate.id,
  name: dbTemplate.name,
  items: dbTemplate.items,
  userId: dbTemplate.user_id,
});

const mapProfileFromDb = (dbProfile: any): Profile => ({
  id: dbProfile.id,
  name: dbProfile.name,
  email: dbProfile.email,
  role: dbProfile.role,
  companyName: dbProfile.company_name,
  phone: dbProfile.phone,
  logoBase64: dbProfile.logo_base_64,
  commissionPercentage: dbProfile.commission_percentage,
  country: dbProfile.country,
  mustChangePasswordOnNextLogin: dbProfile.must_change_password_on_next_login,
});

const mapActivityLogFromDb = (dbLog: any): ActivityLogEntry => ({
  id: dbLog.id,
  timestamp: dbLog.timestamp,
  userId: dbLog.user_id,
  type: dbLog.type,
  details: dbLog.details,
  quoteId: dbLog.quote_id,
  customerName: dbLog.customer_name,
});

const mapLoginAttemptFromDb = (dbAttempt: any): LoginAttempt => ({
  id: dbAttempt.id,
  userId: dbAttempt.user_id,
  emailAttempt: dbAttempt.email_attempt,
  timestamp: dbAttempt.timestamp,
  status: dbAttempt.status,
});


const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('calculator');
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  
  // Data state
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [lrfData, setLrfData] = useState<LeaseRateFactorsData | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({ appLogoBase64: null });
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginAttempt[]>([]);
  const [tcoSettings, setTcoSettings] = useState<TcoSettings | null>(null);

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { t, language } = useLanguage();

  const createNewQuote = (): Quote => {
    let defaultCurrency = 'EUR';
    if (currentProfile?.country) {
      defaultCurrency = COUNTRY_CURRENCY_MAP[currentProfile.country] || 'EUR';
    } else {
      const countryCode = LANGUAGE_TO_COUNTRY_MAP[language.code];
      if (countryCode) {
        defaultCurrency = COUNTRY_CURRENCY_MAP[countryCode] || 'EUR';
      }
    }

    return {
      id: uuidv4(),
      customerName: '',
      projectName: '',
      expectedStartDate: new Date().toISOString(),
      options: [{ id: uuidv4(), name: 'Option A', items: [] }],
      status: QuoteStatus.Draft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: defaultCurrency,
      countrySpecificDetails: {},
    };
  };
  
  const [quote, setQuote] = useState<Quote>(createNewQuote());
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        await fetchData(session.user);
      } else {
        // Clear user-specific data on logout
        setCurrentProfile(null);
        setProfiles([]);
        setLrfData(null);
        setSavedQuotes([]);
        setTemplates([]);
        setWorkflowSettings(null);
        setActivityLog([]);
        setLoginHistory([]);
        setTcoSettings(null);
        setIsLoading(false);
      }
    });

    // Fetch branding settings initially for login page
    fetchBrandingSettings();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async (user: SupabaseUser) => {
    setIsLoading(true);
    try {
      // Fetch user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // .single() throws an error if 0 or more than 1 rows are found.
      // We check for the specific '0 rows' error code (PGRST116) and handle it gracefully.
      // Any other error is a real problem.
      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (!profileData) {
        console.error("User profile not found for authenticated user. Forcing logout.");
        alert("Your user profile is missing or corrupted. Please contact an administrator. You will be logged out.");
        await supabase.auth.signOut();
        setIsLoading(false);
        return; // Stop execution
      }

      const mappedProfile = mapProfileFromDb(profileData);
      setCurrentProfile(mappedProfile);

      // Admin fetches all data, Partner fetches their own
      if (mappedProfile.role === UserRole.Admin) {
        await fetchAllAdminData();
      } else {
        await fetchPartnerData(user.id);
      }
      
      // Fetch shared settings
      await fetchTcoSettings();
      await fetchBrandingSettings();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllAdminData = async () => {
    const [profilesRes, quotesRes, lrfRes, templatesRes, workflowRes, activityRes, loginHistoryRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('quotes').select('*'),
      supabase.from('lease_rate_factors').select('data').single(),
      supabase.from('templates').select('*'),
      supabase.from('workflow_settings').select('data').single(),
      supabase.from('activity_log').select('*').order('timestamp', { ascending: false }),
      supabase.from('login_history').select('*').order('timestamp', { ascending: false }),
    ]);

    if (profilesRes.error) console.error('Error fetching profiles:', profilesRes.error);
    else setProfiles((profilesRes.data || []).map(mapProfileFromDb));
    
    if (quotesRes.error) console.error('Error fetching quotes:', quotesRes.error);
    else setSavedQuotes((quotesRes.data || []).map(mapQuoteFromDb));
    
    if (lrfRes.error) console.error('Error fetching LRF data:', lrfRes.error);
    else setLrfData(lrfRes.data?.data as LeaseRateFactorsData);

    if (templatesRes.error) console.error('Error fetching templates:', templatesRes.error);
    else setTemplates((templatesRes.data || []).map(mapTemplateFromDb));
    
    if (workflowRes.error) console.error('Error fetching workflow settings:', workflowRes.error);
    else setWorkflowSettings(workflowRes.data?.data as WorkflowSettings);

    if (activityRes.error) console.error('Error fetching activity log:', activityRes.error);
    else setActivityLog((activityRes.data || []).map(mapActivityLogFromDb));
    
    if (loginHistoryRes.error) console.error('Error fetching login history:', loginHistoryRes.error);
    else setLoginHistory((loginHistoryRes.data || []).map(mapLoginAttemptFromDb));
  };

  const fetchPartnerData = async (userId: string) => {
    const [quotesRes, templatesRes, lrfRes, workflowRes] = await Promise.all([
      supabase.from('quotes').select('*').eq('created_by_user_id', userId),
      supabase.from('templates').select('*').eq('user_id', userId),
      supabase.from('lease_rate_factors').select('data').single(),
      supabase.from('workflow_settings').select('data').single(),
    ]);

    if (quotesRes.error) console.error('Error fetching quotes:', quotesRes.error);
    else setSavedQuotes((quotesRes.data || []).map(mapQuoteFromDb));

    if (templatesRes.error) console.error('Error fetching templates:', templatesRes.error);
    else setTemplates((templatesRes.data || []).map(mapTemplateFromDb));
    
    if(lrfRes.error) console.error("Error fetching LRF data", lrfRes.error);
    else setLrfData(lrfRes.data?.data as LeaseRateFactorsData);
    
    if(workflowRes.error) console.error("Error fetching workflow settings", workflowRes.error);
    else setWorkflowSettings(workflowRes.data?.data as WorkflowSettings);
  };
  
  const fetchTcoSettings = async () => {
     const { data, error } = await supabase.from('tco_settings').select('data').single();
     if(error) console.error("Error fetching TCO settings", error);
     else setTcoSettings(data?.data as TcoSettings);
  }
  
  const fetchBrandingSettings = async () => {
      const { data, error } = await supabase.from('branding_settings').select('data').single();
      if (error) {
        console.error("Error fetching branding settings", error);
        setBrandingSettings({ appLogoBase64: null });
      } else {
        const settings = data?.data as BrandingSettings;
        setBrandingSettings({ appLogoBase64: settings?.appLogoBase64 || null });
      }
  }
  
  // Functions to update data in Supabase
  const handleQuoteSave = async (quoteToSave: Quote) => {
    if (!currentProfile) return;

    const {
      customerName, projectName, expectedStartDate, createdByUserId, 
      customerAddress, customerCity, customerPostalCode, customerCountry, 
      customerContactName, customerContactEmail, customerContactPhone, 
      customerVatId, creditType, currency, countrySpecificDetails, ...restOfQuote
    } = quoteToSave;
    
    const quotePayload = {
      ...restOfQuote,
      customer_name: customerName,
      project_name: projectName,
      expected_start_date: expectedStartDate,
      created_by_user_id: createdByUserId || currentProfile.id,
      customer_address: customerAddress,
      customer_city: customerCity,
      customer_postal_code: customerPostalCode,
      customer_country: customerCountry,
      customer_contact_name: customerContactName,
      customer_contact_email: customerContactEmail,
      customer_contact_phone: customerContactPhone,
      customer_vat_id: customerVatId,
      credit_type: creditType,
      currency: currency,
      country_specific_details: countrySpecificDetails,
      updated_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase.from('quotes').upsert(quotePayload).select().single();

    if(error) {
      console.error("Error saving quote", error);
    } else if (data) {
      const savedQuote = mapQuoteFromDb(data);
      setSavedQuotes(prev => {
        const index = prev.findIndex(q => q.id === savedQuote.id);
        if (index > -1) {
          const newQuotes = [...prev];
          newQuotes[index] = savedQuote;
          return newQuotes;
        }
        return [...prev, savedQuote];
      });
       if (quote.id === savedQuote.id) {
          setQuote(savedQuote);
      }
    }
  };

  const addActivityLog = async (type: ActivityType, details: string, quoteContext?: Quote) => {
    if (!currentProfile) return;
    const newEntry = {
      user_id: currentProfile.id,
      type,
      details,
      quote_id: quoteContext?.id,
      customer_name: quoteContext?.customerName,
    };
    const { data, error } = await supabase.from('activity_log').insert(newEntry).select().single();
    if (error) {
      console.error("Error adding activity log", error);
    } else if (data) {
      setActivityLog(prev => [mapActivityLogFromDb(data), ...prev]);
    }
  };

  const handleAdminUserUpdate = async (profile: Profile, newPasswordEntered: boolean) => {
    const { id, companyName, logoBase64, commissionPercentage, mustChangePasswordOnNextLogin, ...rest } = profile;
    const payload = {
        ...rest,
        company_name: companyName,
        logo_base_64: logoBase64,
        commission_percentage: commissionPercentage,
        must_change_password_on_next_login: newPasswordEntered ? true : mustChangePasswordOnNextLogin,
    };
    const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single();

    if (error) {
        alert(t('admin.users.error.updateFailed') + `: ${error.message}`);
        return;
    }

    if (newPasswordEntered) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(profile.email, {
            redirectTo: window.location.origin,
        });
        if (resetError) {
            alert(t('admin.users.error.profileSavedButResetFailed') + `: ${resetError.message}`);
        } else {
            alert(t('admin.users.success.profileSavedAndResetSent', { email: profile.email }));
        }
    }

    if (data) {
        const updatedProfile = mapProfileFromDb(data);
        setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
        if (currentProfile?.id === updatedProfile.id) {
            setCurrentProfile(updatedProfile);
        }
    }
  };
  
  const handleAdminUserCreate = async (profileData: Partial<Profile>, password: string) => {
      alert(t('admin.users.warning.adminLogoutOnCreate'));
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
          email: profileData.email!,
          password,
      });

      if (authError || !authData.user) {
          alert(t('admin.users.error.createUserFailed') + `: ${authError?.message}`);
          return;
      }
      
      const profilePayload = {
          id: authData.user.id,
          email: profileData.email!,
          name: profileData.name!,
          role: profileData.role!,
          company_name: profileData.companyName,
          phone: profileData.phone,
          country: profileData.country,
          commission_percentage: profileData.commissionPercentage,
          logo_base_64: profileData.logoBase64,
          must_change_password_on_next_login: true,
      };
      const { error: profileError } = await supabase.from('profiles').insert(profilePayload);
      if (profileError) {
          alert(t('admin.users.error.createProfileFailed') + `: ${profileError.message}`);
      }
      // onAuthStateChange will handle the rest
  };
  
  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!session || !currentProfile) {
    return <Login brandingSettings={brandingSettings} />;
  }
  
  if (currentProfile.mustChangePasswordOnNextLogin) {
    return (
      <ForcePasswordChangeModal
        user={currentProfile}
        onPasswordChanged={async (userId, newPass) => {
          const { error: passError } = await supabase.auth.updateUser({ password: newPass });
          if (passError) {
            console.error("Error updating password:", passError);
            alert("Failed to update password. " + passError.message);
            return;
          }
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ must_change_password_on_next_login: false })
            .eq('id', userId);

          if (profileError) {
            console.error("Error updating profile flag:", profileError);
            alert("Password updated, but failed to update profile flag. Please contact admin.");
          } else {
            setCurrentProfile(p => p ? { ...p, mustChangePasswordOnNextLogin: false } : null);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen text-slate-800 flex flex-col">
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="bg-chg-blue text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-between items-center gap-4 py-3">
              <h1 className="text-xl font-bold">{t('app.title')}</h1>
              <div className="flex items-center space-x-4">
                <LanguageSwitcher />
                <CurrencySwitcher
                    currentCurrency={quote.currency || 'EUR'}
                    onCurrencyChange={(newCurrency) => setQuote(q => ({ ...q, currency: newCurrency }))}
                />
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm text-slate-300">{t('app.welcome', { name: currentProfile.name, role: currentProfile.role })}</span>
                </div>
                {currentProfile.role === UserRole.Partner && (
                  <Button onClick={() => setIsProfileModalOpen(true)} variant="inverted" size="sm" leftIcon={<UserCircleIcon />}>
                    {t('app.myProfile')}
                  </Button>
                )}
                <Button onClick={() => supabase.auth.signOut()} variant="inverted" size="sm">{t('app.logout')}</Button>
              </div>
            </div>
          </div>
        </div>
        <div>
          <nav className="-mb-px max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Tabs>
              <Tab isActive={activeTab === 'calculator'} onClick={() => setActiveTab('calculator')}>
                {t('tabs.calculator')}
              </Tab>
              <Tab isActive={activeTab === 'tco'} onClick={() => setActiveTab('tco')}>
                {t('tabs.tco')}
              </Tab>
              {currentProfile.role === UserRole.Admin && (
                <Tab isActive={activeTab === 'admin'} onClick={() => setActiveTab('admin')}>
                  {t('tabs.admin')}
                </Tab>
              )}
            </Tabs>
          </nav>
        </div>
      </header>
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calculator' && lrfData && workflowSettings && tcoSettings && (
          <CalculationSheet 
            lrfData={lrfData}
            quote={quote}
            setQuote={setQuote}
            savedQuotes={savedQuotes}
            onQuoteSave={handleQuoteSave}
            onQuoteDelete={async (id) => {
              const { error } = await supabase.from('quotes').delete().eq('id', id);
              if (!error) {
                setSavedQuotes(prev => prev.filter(q => q.id !== id));
              }
            }}
            createNewQuote={createNewQuote}
            currentUser={currentProfile}
            profiles={profiles}
            tcoSettings={tcoSettings}
            templates={templates}
            onTemplateSave={async (template) => {
              const payload = {
                name: template.name,
                items: template.items,
                user_id: template.userId
              };
              const {data, error} = await supabase.from('templates').upsert(payload).select().single();
              if (error) {
                console.error("Error saving template:", error)
              } else if (data) {
                const newTemplate = mapTemplateFromDb(data);
                setTemplates(prev => {
                    const existingIndex = prev.findIndex(t => t.id === newTemplate.id);
                    if (existingIndex > -1) {
                        const updated = [...prev];
                        updated[existingIndex] = newTemplate;
                        return updated;
                    }
                    return [...prev, newTemplate];
                });
              }
            }}
            onTemplateDelete={async (id) => {
              const { error } = await supabase.from('templates').delete().eq('id', id);
              if (!error) {
                setTemplates(prev => prev.filter(t => t.id !== id));
              }
            }}
            workflowSettings={workflowSettings}
            addActivityLog={addActivityLog}
          />
        )}
        {activeTab === 'tco' && lrfData && tcoSettings && (
          <TcoSheet 
            quote={quote} 
            lrfData={lrfData}
            tcoSettings={tcoSettings}
            setTcoSettings={async (newSettings) => {
              setTcoSettings(newSettings);
              await supabase.from('tco_settings').upsert({ id: 1, data: newSettings });
            }}
            currentUser={currentProfile}
          />
        )}
        {activeTab === 'admin' && currentProfile.role === UserRole.Admin && lrfData && workflowSettings && (
          <AdminSheet 
            profiles={profiles}
            onUserUpdate={handleAdminUserUpdate}
            onUserCreate={handleAdminUserCreate}
            lrfData={lrfData}
            setLrfData={async (newData) => {
              setLrfData(newData);
              await supabase.from('lease_rate_factors').upsert({ id: 1, data: newData });
            }}
            currentUser={currentProfile}
            brandingSettings={brandingSettings}
            setBrandingSettings={async (newSettings) => {
              setBrandingSettings(newSettings);
              await supabase.from('branding_settings').upsert({ id: 1, data: newSettings });
            }}
            savedQuotes={savedQuotes}
            workflowSettings={workflowSettings}
            setWorkflowSettings={async (newSettings) => {
              setWorkflowSettings(newSettings);
              await supabase.from('workflow_settings').upsert({ id: 1, data: newSettings });
            }}
            activityLog={activityLog}
            loginHistory={loginHistory}
          />
        )}
      </main>
      
      {currentProfile.role === UserRole.Partner && (
          <ProfileModal 
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={currentProfile}
            setUser={async (updatedProfile) => {
              const { id, companyName, logoBase64, commissionPercentage, mustChangePasswordOnNextLogin, ...rest } = updatedProfile;
              const payload = {
                ...rest,
                company_name: companyName,
                logo_base_64: logoBase64,
                commission_percentage: commissionPercentage,
                must_change_password_on_next_login: mustChangePasswordOnNextLogin,
              };
              const { data, error } = await supabase.from('profiles').update(payload).eq('id', id).select().single();
              if (data) setCurrentProfile(mapProfileFromDb(data));
              if (error) console.error("Error updating profile", error);
            }}
            onPasswordChange={async (newPass) => {
                const { error } = await supabase.auth.updateUser({ password: newPass });
                if (error) {
                    console.error("Failed to update password:", error);
                    alert("Error updating password: " + error.message);
                    return false;
                }
                alert("Password updated successfully!");
                return true;
            }}
          />
      )}

      <footer className="text-center py-4 bg-white border-t text-slate-600 text-xs">
          <p>{t('app.copyright', { year: new Date().getFullYear() })}</p>
      </footer>
      
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsAssistantOpen(true)}
          className="bg-chg-active-blue text-white p-4 rounded-full shadow-lg hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500"
          aria-label="Open AI Assistant"
        >
          <SparklesIcon className="w-6 h-6" />
        </button>
      </div>
      
      <AiAssistant 
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

    </div>
  );
};

export default App;