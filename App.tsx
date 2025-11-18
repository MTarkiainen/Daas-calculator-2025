import React, { useState, useEffect } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { Profile, LeaseRateFactorsData, UserRole, Quote, TcoSettings, Template, QuoteStatus, ActivityLogEntry, ActivityType, LoginAttempt, BrandingSettings, WorkflowSettings } from './types';
import CalculationSheet from './components/calculation/CalculationSheet';
import AdminSheet from './components/admin/AdminSheet';
import TcoSheet from './components/tco/TcoSheet';
import { Tabs, Tab } from './components/ui/Tabs';
import Login from './components/Login';
import ProfileModal from './components/profile/ProfileModal';
import UserCircleIcon from './components/ui/icons/UserCircleIcon';
import { v4 as uuidv4 } from 'uuid';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import ForcePasswordChangeModal from './components/profile/ForcePasswordChangeModal';
import { useLanguage } from './i18n/LanguageContext';
import LanguageSwitcher from './components/ui/LanguageSwitcher';
import { Dropdown, DropdownItem } from './components/ui/Dropdown';
import LogoutIcon from './components/ui/icons/LogoutIcon';
import AiAssistant from './components/ai/AiAssistant';
import SparklesIcon from './components/ui/icons/SparklesIcon';
import { Button } from './components/ui/Button';

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
  const [activeTab, setActiveTab] = useState<'calculator' | 'tco' | 'admin'>('calculator');
  const [session, setSession] = useState<Session | null>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  
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
  const { t } = useLanguage();

  const createNewQuote = (): Quote => {
    return {
      id: uuidv4(),
      customerName: '',
      projectName: '',
      expectedStartDate: new Date().toISOString(),
      options: [{ id: uuidv4(), name: 'Option A', items: [] }],
      status: QuoteStatus.Draft,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      currency: 'EUR', // Always default to EUR
      countrySpecificDetails: {},
    };
  };
  
  const [quote, setQuote] = useState<Quote>(createNewQuote());
  
  // Render a blocking error if Supabase is not configured.
  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
          <div>
            <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="mt-4 text-2xl font-bold text-red-600">Configuration Error</h2>
          </div>
          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
            <p className="text-sm font-medium text-red-800">
              Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are not set.
            </p>
          </div>
          <p className="text-sm text-slate-500">
            This application requires a connection to a Supabase project to function. Please create a <code>.env</code> file in the project root and provide your Supabase credentials.
            <br/><br/>
            Refer to the <strong>README.md</strong> file for detailed setup instructions.
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    // When using the mock, this will immediately return a session.
    // When using real Supabase, it will wait for the auth state.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);

      if (session?.user) {
        await fetchData(session.user);
      } else {
        setCurrentProfile(null);
        setIsLoading(false);
      }
    });

    fetchBrandingSettings();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async (user: SupabaseUser) => {
    setIsLoading(true);
    try {
      let { data: profileData, error: profileErrorFromDb } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      // Handle profile not found: if a profile doesn't exist for the user, create it automatically.
      if ((profileErrorFromDb && profileErrorFromDb.code === 'PGRST116') || !profileData) {
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          if (countError === null) { // Proceed only if we could count successfully
            const isFirstUser = count === 0;
            const userMetaData = user.user_metadata;

            // Determine role: Use metadata if available, otherwise Admin for the first user, Partner for subsequent ones.
            const roleToAssign = userMetaData?.role || (isFirstUser ? UserRole.Admin : UserRole.Partner);
            const nameToAssign = userMetaData?.name || user.email!;

            const newProfilePayload = {
              id: user.id,
              email: user.email!,
              name: nameToAssign,
              role: roleToAssign,
              company_name: userMetaData?.company_name,
              phone: userMetaData?.phone,
              logo_base_64: userMetaData?.logo_base_64,
              commission_percentage: userMetaData?.commission_percentage,
              country: userMetaData?.country,
            };

            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert(newProfilePayload)
              .select()
              .single();
            
            if (!insertError && newProfile) {
              profileData = newProfile;
              profileErrorFromDb = null; // Clear the original "not found" error
            } else if (insertError) {
              // If insertion fails, we'll fall through to the error screen, which is correct.
              // Log the insertion error for debugging.
              console.error("Failed to auto-create profile:", insertError);
            }
          }
      }
      
      if (profileErrorFromDb || !profileData) {
        console.error("User profile not found. Forcing logout.", profileErrorFromDb);
        setProfileError(t('app.error.profileMissing'));
        await supabase.auth.signOut();
        setIsLoading(false);
        return;
      }

      const mappedProfile = mapProfileFromDb(profileData);
      setCurrentProfile(mappedProfile);

      if (mappedProfile.role === UserRole.Admin) {
        await fetchAllAdminData();
      } else {
        await fetchPartnerData(user.id);
      }
      
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
  };
  
  const fetchBrandingSettings = async () => {
      const { data, error } = await supabase.from('branding_settings').select('data').single();
      if (error) {
        console.error("Error fetching branding settings", error);
        setBrandingSettings({ appLogoBase64: null });
      } else {
        const settings = data?.data as BrandingSettings;
        setBrandingSettings({ appLogoBase64: settings?.appLogoBase64 || null });
      }
  };

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
  
    const handlePasswordChanged = async (userId: string, newPass: string) => {
    const { error: authError } = await supabase.auth.updateUser({ password: newPass });
    if (authError) {
      alert(`Error updating password: ${authError.message}`);
      return;
    }
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ must_change_password_on_next_login: false })
      .eq('id', userId);
    
    if (profileError) {
      alert(`Password updated, but failed to update profile status: ${profileError.message}`);
      return;
    }
    
    alert("Password successfully updated!");
    // Refetch profile to update UI state
    if(session?.user) await fetchData(session.user);
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
      console.error('Error adding activity log:', error);
    } else if (data) {
      setActivityLog(prev => [mapActivityLogFromDb(data), ...prev]);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
      alert(`Failed to log out: ${error.message}`);
    }
  };

  if (profileError) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg text-center space-y-6">
                <div>
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="mt-4 text-2xl font-bold text-red-600">Authentication Error</h2>
                </div>
                
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                    <p className="text-sm font-medium text-red-800">{profileError}</p>
                </div>
                
                <p className="text-sm text-slate-500">
                    This error typically occurs when the user account exists for login, but its corresponding profile data is missing from the database.
                    <br/><br/>
                    Please ensure you have followed the setup steps in the <strong>README.md</strong> file, specifically the section on creating both an authentication user and its associated `profiles` entry.
                </p>
                
                <Button onClick={() => setProfileError(null)} className="w-full mt-6">
                    Return to Login
                </Button>
            </div>
        </div>
    );
  }

  if (!session) {
    return <Login brandingSettings={brandingSettings} />;
  }

  if (isLoading || !currentProfile || !lrfData || !tcoSettings || !workflowSettings) {
    return <div className="flex h-screen w-screen items-center justify-center">Loading...</div>;
  }
  
  if (currentProfile.mustChangePasswordOnNextLogin) {
    return <ForcePasswordChangeModal user={currentProfile} onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
       <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentProfile}
          setUser={async (updatedProfile) => {
             const { error } = await supabase.from('profiles').update({
                name: updatedProfile.name,
                company_name: updatedProfile.companyName,
                phone: updatedProfile.phone,
                logo_base_64: updatedProfile.logoBase64
             }).eq('id', updatedProfile.id);
             if (error) alert("Failed to update profile.");
             else setCurrentProfile(updatedProfile);
          }}
          onPasswordChange={async (newPass) => {
              const { error } = await supabase.auth.updateUser({ password: newPass });
              if (error) {
                alert(`Error: ${error.message}`);
                return false;
              }
              alert("Password changed successfully.");
              return true;
          }}
        />

      <header className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border">
          <div className="flex items-center gap-4">
             {brandingSettings.appLogoBase64 ? (
                <img src={brandingSettings.appLogoBase64} alt="Company Logo" className="h-10 w-auto object-contain" />
              ) : (
                <h1 className="text-2xl font-bold text-chg-blue">Rental Portal</h1>
              )}
          </div>
          <div className="flex items-center gap-4">
              <LanguageSwitcher />
              <Dropdown
                trigger={
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-chg-active-blue" role="button" tabIndex={0} aria-haspopup="true">
                      <span>{currentProfile.name}</span>
                      <UserCircleIcon className="w-8 h-8 text-slate-500" />
                  </div>
                }
              >
                <DropdownItem onClick={() => setIsProfileModalOpen(true)}>
                  <UserCircleIcon className="w-5 h-5 text-slate-500" />
                  <span>{t('app.myProfile')}</span>
                </DropdownItem>
                <DropdownItem onClick={handleLogout}>
                  <LogoutIcon className="w-5 h-5 text-slate-500" />
                  <span>{t('app.logout')}</span>
                </DropdownItem>
              </Dropdown>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
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
        <div className="mt-6">
          {activeTab === 'calculator' && (
            <CalculationSheet
              lrfData={lrfData}
              quote={quote}
              setQuote={setQuote}
              savedQuotes={savedQuotes}
              onQuoteSave={handleQuoteSave}
              onQuoteDelete={async (id) => { 
                  const { error } = await supabase.from('quotes').delete().eq('id', id);
                  if (error) console.error("Error deleting quote", error);
                  else setSavedQuotes(prev => prev.filter(q => q.id !== id));
              }}
              createNewQuote={createNewQuote}
              currentUser={currentProfile}
              profiles={profiles}
              tcoSettings={tcoSettings}
              templates={templates}
              onTemplateSave={async (template) => {
                  const { userId, ...rest } = template;
                  const { data, error } = await supabase.from('templates').insert({ ...rest, user_id: userId }).select().single();
                  if (error) console.error("Error saving template", error);
                  else if (data) setTemplates(prev => [...prev, mapTemplateFromDb(data)]);
              }}
               onTemplateDelete={async (id) => {
                  const { error } = await supabase.from('templates').delete().eq('id', id);
                  if (error) console.error("Error deleting template", error);
                  else setTemplates(prev => prev.filter(t => t.id !== id));
              }}
              workflowSettings={workflowSettings}
              addActivityLog={addActivityLog}
            />
          )}
          {activeTab === 'tco' && (
              <TcoSheet 
                  quote={quote}
                  lrfData={lrfData}
                  tcoSettings={tcoSettings}
                  setTcoSettings={async (settings) => {
                      const { error } = await supabase.from('tco_settings').update({ data: settings }).eq('id', 1);
                      if (error) console.error("Error saving TCO settings", error);
                      else setTcoSettings(settings);
                  }}
                  currentUser={currentProfile}
              />
          )}
          {activeTab === 'admin' && session?.user && (
              <AdminSheet
                  profiles={profiles}
                  onUserUpdate={async (profile, passChanged) => {
                      const {id, ...rest} = profile;
                      const payload = {
                          name: rest.name,
                          company_name: rest.companyName,
                          phone: rest.phone,
                          logo_base_64: rest.logoBase64,
                          commission_percentage: rest.commissionPercentage,
                          country: rest.country,
                          role: rest.role,
                          must_change_password_on_next_login: passChanged,
                      };
                      const { error } = await supabase.from('profiles').update(payload).eq('id', id);
                      if (error) {
                        console.error("Error updating profile", error);
                        alert(`Failed to update profile: ${error.message}`);
                      } else {
                        await fetchAllAdminData();
                      }
                  }}
                  onUserCreate={async (profileData, password) => {
                      // 1. Get admin's current session to restore it later
                      const { data: { session: adminSession } } = await supabase.auth.getSession();
                      if (!adminSession) {
                          alert(t('app.error.sessionExpired'));
                          await supabase.auth.signOut();
                          return;
                      }

                      // 2. Create the new user. This will sign out the admin.
                      const { data: signUpData, error: authError } = await supabase.auth.signUp({
                          email: profileData.email!,
                          password: password,
                          options: {
                              data: {
                                  name: profileData.name,
                                  role: profileData.role,
                                  company_name: profileData.companyName,
                                  phone: profileData.phone,
                                  logo_base_64: profileData.logoBase64,
                                  commission_percentage: profileData.commissionPercentage,
                                  country: profileData.country,
                              }
                          }
                      });

                      // 3. Restore the admin's session immediately.
                      const { error: sessionError } = await supabase.auth.setSession({
                          access_token: adminSession.access_token,
                          refresh_token: adminSession.refresh_token,
                      });

                      if (sessionError) {
                          alert(t('app.error.sessionRestoreFailed'));
                          await supabase.auth.signOut();
                          return;
                      }

                      // 4. Handle signUp result
                      if (authError) {
                          alert(`${t('admin.users.error.createUserFailed')}: ${authError.message}`);
                      } else if (signUpData.user) {
                          // The profile will be created automatically on the new user's first login.
                          alert(t('admin.users.userCreationNote'));
                          await fetchAllAdminData();
                      }
                  }}
                  lrfData={lrfData}
                  setLrfData={async (data) => {
                      const { error } = await supabase.from('lease_rate_factors').update({ data }).eq('id', 1);
                      if (error) console.error("Error saving LRF data", error);
                      else setLrfData(data);
                  }}
                  currentUser={currentProfile}
                  loginHistory={loginHistory}
                  brandingSettings={brandingSettings}
                  setBrandingSettings={async (settings) => {
                      const { error } = await supabase.from('branding_settings').update({ data: settings }).eq('id', 1);
                      if (error) console.error("Error saving branding settings", error);
                      else setBrandingSettings(settings);
                  }}
                  savedQuotes={savedQuotes}
                  workflowSettings={workflowSettings}
                  setWorkflowSettings={async (settings) => {
                       const { error } = await supabase.from('workflow_settings').update({ data: settings }).eq('id', 1);
                       if (error) console.error("Error saving workflow settings", error);
                       else setWorkflowSettings(settings);
                  }}
                  activityLog={activityLog}
              />
          )}
        </div>
      </main>

       <div className="fixed bottom-6 right-6 z-40">
            <Button 
                variant="primary"
                size="lg"
                onClick={() => setIsAssistantOpen(true)}
                leftIcon={<SparklesIcon />}
            >
                AI Assistant
            </Button>
        </div>

        <AiAssistant 
            isOpen={isAssistantOpen}
            onClose={() => setIsAssistantOpen(false)}
        />
    </div>
  );
};

export default App;