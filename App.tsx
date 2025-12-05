import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import CalculationSheet from './components/calculation/CalculationSheet';
import AdminSheet from './components/admin/AdminSheet';
import TcoSheet from './components/tco/TcoSheet';
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Profile, Quote, LeaseRateFactorsData, TcoSettings, BrandingSettings, WorkflowSettings, PartnerOrganization, UserRole, PriceViewMode, ActivityType, QuoteStatus, LegalDocument, ExchangeRatesDb } from './types';
import { v4 as uuidv4 } from 'uuid';
import AiAssistant from './components/ai/AiAssistant';
import ProfileModal from './components/profile/ProfileModal';
import MenuIcon from './components/ui/icons/MenuIcon';
import LanguageSwitcher from './components/ui/LanguageSwitcher';
import CurrencySwitcher from './components/ui/CurrencySwitcher';
import QuestionMarkCircleIcon from './components/ui/icons/QuestionMarkCircleIcon';
import BellIcon from './components/ui/icons/BellIcon';
import { Dropdown, DropdownItem } from './components/ui/Dropdown';
import LogoutIcon from './components/ui/icons/LogoutIcon';
import UserCircleIcon from './components/ui/icons/UserCircleIcon';
import { INDUSTRIES_WACC } from './constants';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeView, setActiveView] = useState<'calculator' | 'tco' | 'admin'>('calculator');
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Data State
  const [quote, setQuote] = useState<Quote>({
    id: uuidv4(),
    customerName: '',
    projectName: '',
    status: QuoteStatus.Draft,
    options: [{ id: uuidv4(), name: 'Option A', items: [] }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByUserId: '',
    currency: 'EUR',
    countrySpecificDetails: {}
  });

  const [savedQuotes, setSavedQuotes] = useState<Quote[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [lrfData, setLrfData] = useState<LeaseRateFactorsData>({
    factors: {},
    lastUpdatedAt: new Date().toISOString(),
    updatedByUserId: 'system',
    updateLog: [],
    serviceCosts: {},
    notificationAdminId: '',
    countryFactors: {},
    countryServiceCosts: {},
    countrySettings: {}
  });
  
  // TCO Settings with defaults populated from constants
  const [tcoSettings, setTcoSettings] = useState<TcoSettings>({
    selectedIndustry: 'Technology',
    useCustomWacc: false,
    customWacc: 10,
    deploymentCostPerDevice: 50,
    itSupportHoursPerDeviceYear: 2,
    itStaffHourlyRate: 60,
    failuresPerDeviceYear: 0.5,
    downtimeHoursPerFailure: 4,
    employeeCostPerHour: 40,
    eoldCostPerDevice: 30,
    residualValuePercentage: 5,
    industryWaccs: INDUSTRIES_WACC // Initialize with full list
  });

  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({});
  const [workflowSettings, setWorkflowSettings] = useState<WorkflowSettings>({ primaryCreditApprovalEmail: '', substitutes: [] });
  const [organizations, setOrganizations] = useState<PartnerOrganization[]>([]);
  const [activityLog, setActivityLog] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [priceViewMode, setPriceViewMode] = useState<PriceViewMode>('detailed');
  
  // Exchange Rates State
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({ EUR: 1, USD: 1.1, GBP: 0.85 });
  const [exchangeRatesMeta, setExchangeRatesMeta] = useState<Partial<ExchangeRatesDb>>({});

  useEffect(() => {
    // Fetch branding immediately for login screen
    fetchBrandingSettings();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) fetchUserData(session.user.id);
      else setCurrentUser(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (profileData) {
            setCurrentUser({
                id: profileData.id,
                email: profileData.email,
                name: profileData.name,
                role: profileData.role,
                phone: profileData.phone,
                country: profileData.country,
                partnerOrganizationId: profileData.partner_organization_id,
                managedCountries: profileData.managed_countries
            });
        } else {
            const email = session?.user?.email || '';
            const name = email.split('@')[0];
            const newId = userId;
            
            const dbProfile = {
                id: newId,
                email: email,
                name: name,
                role: UserRole.Partner,
            };
            
            const { error: insertError } = await supabase.from('profiles').insert(dbProfile);
            
            if (!insertError) {
                setCurrentUser({
                    id: newId,
                    email: email,
                    name: name,
                    role: UserRole.Partner
                });
            } else {
                console.error("Failed to create profile record:", insertError);
                setCurrentUser({
                    id: newId,
                    email: email,
                    name: name,
                    role: UserRole.Partner
                });
            }
        }

        // Fetch Application Data
        fetchProfiles();
        fetchLegalDocuments();
        fetchOrganizations();
        fetchExchangeRates(); 
        fetchQuotes(); 
        fetchBrandingSettings(); 
        fetchTcoSettings();
        fetchLrfData(); // NEW: Fetch LRF settings

    } catch (e) {
        console.error("Error loading user data:", e);
    }
  };

  const fetchProfiles = async () => {
      const { data, error } = await supabase.from('profiles').select('*');
      if (data) {
          const mappedProfiles = data.map(p => ({
              id: p.id,
              email: p.email,
              name: p.name,
              role: p.role,
              phone: p.phone,
              country: p.country,
              partnerOrganizationId: p.partner_organization_id,
              managedCountries: p.managed_countries
          }));
          setProfiles(mappedProfiles);
      }
  };

  const fetchLegalDocuments = async () => {
      try {
          const { data } = await supabase.from('legal_documents').select('*');
          if (data) {
              setLegalDocuments(data.map(d => ({
                  id: d.id,
                  title: d.title,
                  content: d.content,
                  updatedAt: d.updated_at
              })));
          }
      } catch (err) {
          console.error("Failed to fetch legal docs", err);
      }
  };

  const fetchOrganizations = async () => {
      const { data } = await supabase.from('partner_organizations').select('*');
      if (data) setOrganizations(data.map(o => ({
          id: o.id,
          name: o.name,
          commissionPercentage: o.commission_percentage,
          country: o.country,
          logoBase64: o.logo_base_64
      })));
  };

  const fetchExchangeRates = async () => {
      try {
          const { data } = await supabase.from('exchange_rates').select('*').eq('id', 1).single();
          if (data && data.rates) {
              setExchangeRates(data.rates);
              setExchangeRatesMeta({ last_updated: data.last_updated, updated_by: data.updated_by });
          }
      } catch (err) {
          console.error("Exception fetching rates:", err);
      }
  };

  const fetchBrandingSettings = async () => {
      try {
          const { data, error } = await supabase.from('branding_settings').select('*').single();
          if (data) {
              setBrandingSettings({
                  appLogoBase64: data.app_logo_base64,
                  subLogoBase64: data.sub_logo_base64
              });
          } else if (error) {
              // Fallback to local storage if DB fetch fails
              const local = localStorage.getItem('branding_settings_backup');
              if (local) setBrandingSettings(JSON.parse(local));
          }
      } catch (err) {
          console.error("Failed to fetch branding settings, using local backup:", err);
          const local = localStorage.getItem('branding_settings_backup');
          if (local) setBrandingSettings(JSON.parse(local));
      }
  };

  const fetchTcoSettings = async () => {
      try {
          const { data, error } = await supabase.from('tco_settings').select('*').single();
          if (data && data.settings) {
              setTcoSettings(prev => ({ ...prev, ...data.settings }));
          } else if (error) {
              const local = localStorage.getItem('tco_settings_backup');
              if (local) setTcoSettings(prev => ({ ...prev, ...JSON.parse(local) }));
          }
      } catch (err) {
          console.error("Failed to fetch TCO settings, using local backup:", err);
          const local = localStorage.getItem('tco_settings_backup');
          if (local) setTcoSettings(prev => ({ ...prev, ...JSON.parse(local) }));
      }
  };

  // NEW: Fetch LRF Data from Supabase
  const fetchLrfData = async () => {
      try {
          const { data, error } = await supabase.from('lrf_settings').select('*').single();
          if (data && data.settings) {
              setLrfData(data.settings);
          } else if (error) {
              console.warn("LRF fetch error (using local backup):", error.message);
              const local = localStorage.getItem('lrf_data_backup');
              if (local) setLrfData(JSON.parse(local));
          }
      } catch (err) {
          console.error("Failed to fetch LRF data:", err);
          const local = localStorage.getItem('lrf_data_backup');
          if (local) setLrfData(JSON.parse(local));
      }
  };

  const fetchQuotes = async () => {
      const { data } = await supabase.from('quotes').select('*');
      if (data) {
          const mappedQuotes = data.map(q => ({
              id: q.id,
              customerName: q.customer_name,
              projectName: q.project_name,
              status: q.status,
              options: q.options || [],
              createdAt: q.created_at,
              updatedAt: q.updated_at,
              createdByUserId: q.created_by_user_id,
              currency: q.currency,
              creditDecisionNotes: q.credit_decision_notes,
              creditRequestSubmittedAt: q.credit_request_submitted_at,
              countrySpecificDetails: q.country_specific_details,
              deploymentStartDate: q.deployment_start_date
          }));
          setSavedQuotes(mappedQuotes);
      }
  };

  const handleSaveBrandingSettings = async (settings: BrandingSettings) => {
      setBrandingSettings(settings);
      localStorage.setItem('branding_settings_backup', JSON.stringify(settings));
      try {
          const { error } = await supabase.from('branding_settings').upsert({
              id: 1,
              app_logo_base64: settings.appLogoBase64,
              sub_logo_base64: settings.subLogoBase64,
              updated_at: new Date().toISOString()
          });
          if (error) throw error;
      } catch (err) {
          console.error("Database save failed for branding (persisting locally):", err);
          throw err; 
      }
  };

  const handleSaveTcoSettings = async (settings: TcoSettings) => {
      setTcoSettings(settings);
      localStorage.setItem('tco_settings_backup', JSON.stringify(settings));
      try {
          const { error } = await supabase.from('tco_settings').upsert({
              id: 1,
              settings: settings,
              updated_at: new Date().toISOString(),
              updated_by: currentUser?.id
          });
          if (error) throw error;
      } catch (err) {
          console.error("Database save failed for TCO settings (persisting locally):", err);
          throw err;
      }
  };

  // NEW: Save LRF Data to Supabase
  const handleSaveLrfData = async (data: LeaseRateFactorsData) => {
      setLrfData(data);
      localStorage.setItem('lrf_data_backup', JSON.stringify(data));
      try {
          const { error } = await supabase.from('lrf_settings').upsert({
              id: 1,
              settings: data,
              updated_at: new Date().toISOString(),
              updated_by: currentUser?.id
          });
          if (error) throw error;
      } catch (err) {
          console.error("Database save failed for LRF settings (persisting locally):", err);
          throw err;
      }
  };

  // --- User Management Actions ---

  const handleUserCreate = async (profileData: Partial<Profile>, password: string) => {
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      const { data: authData, error: authError } = await tempClient.auth.signUp({
          email: profileData.email!,
          password: password,
          options: { data: { name: profileData.name } }
      });

      if (authError) {
          alert(`Error creating Auth user: ${authError.message}`);
          return;
      }

      if (authData.user) {
          const newId = authData.user.id;
          const dbProfile = {
              id: newId,
              email: profileData.email!,
              name: profileData.name!,
              role: profileData.role || UserRole.Partner,
              country: profileData.country,
              phone: profileData.phone,
              partner_organization_id: profileData.partnerOrganizationId,
              managed_countries: profileData.managedCountries
          };

          const { error: profileError } = await supabase.from('profiles').insert(dbProfile);
          if (profileError) {
              alert(`Auth user created, but Profile creation failed: ${profileError.message}`);
          } else {
              alert("User successfully created. They can now log in.");
              fetchProfiles();
          }
      }
  };

  const handleUserUpdate = async (updatedProfile: Profile, newPasswordEntered: boolean) => {
      const { error } = await supabase
          .from('profiles')
          .update({
              name: updatedProfile.name,
              role: updatedProfile.role,
              country: updatedProfile.country,
              phone: updatedProfile.phone,
              partner_organization_id: updatedProfile.partnerOrganizationId,
              managed_countries: updatedProfile.managedCountries
          })
          .eq('id', updatedProfile.id);

      if (error) {
          alert(`Error updating profile: ${error.message}`);
      } else {
          fetchProfiles();
      }
      if (newPasswordEntered) {
          alert("Note: Password updates via this panel are limited. The user should reset their own password via 'Forgot Password'.");
      }
  };

  const handleUserDelete = async (userId: string) => {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) {
          alert(`Error deleting profile: ${error.message}`);
      } else {
          fetchProfiles();
      }
  };

  const handleOrganizationsUpdate = async () => {
      await fetchOrganizations();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
  };

  const createNewQuote = () => ({
    id: uuidv4(),
    customerName: '',
    projectName: '',
    status: QuoteStatus.Draft,
    options: [{ id: uuidv4(), name: 'Option A', items: [] }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdByUserId: currentUser?.id || '',
    currency: 'EUR',
    countrySpecificDetails: {}
  });

  const handleSaveQuote = async (q: Quote) => {
      const updated = { 
          ...q, 
          updatedAt: new Date().toISOString(),
          createdByUserId: currentUser?.id 
      };
      
      const { error } = await supabase.from('quotes').upsert({
          id: updated.id,
          customer_name: updated.customerName,
          project_name: updated.projectName,
          status: updated.status,
          options: updated.options,
          currency: updated.currency,
          created_at: updated.createdAt,
          updated_at: updated.updatedAt,
          created_by_user_id: updated.createdByUserId,
          country_specific_details: updated.countrySpecificDetails,
          credit_request_notes: updated.creditRequestNotes,
          credit_request_submitted_at: updated.creditRequestSubmittedAt,
          deployment_start_date: updated.deploymentStartDate
      });

      if (error) {
          console.error("Save Error:", error);
          alert("Failed to save quote: " + error.message);
      } else {
          setSavedQuotes(prev => {
              const exists = prev.find(sq => sq.id === q.id);
              if (exists) return prev.map(sq => sq.id === q.id ? updated : sq);
              return [...prev, updated];
          });
          setQuote(updated);
          alert("Quote saved successfully.");
      }
  };

  const handleDeleteQuote = async (id: string) => {
      const { error } = await supabase.from('quotes').delete().eq('id', id);
      if (error) {
          alert("Error deleting quote: " + error.message);
      } else {
          setSavedQuotes(prev => prev.filter(q => q.id !== id));
      }
  };

  const handleAddActivityLog = async (type: ActivityType, details: string) => {
      const newLog = {
          type,
          details,
          timestamp: new Date().toISOString(),
          userId: currentUser?.id,
      };
      const { error } = await supabase.from('activity_log').insert({
          type: newLog.type,
          details: newLog.details,
          user_id: newLog.userId
      });
      if (!error) {
          setActivityLog(prev => [newLog, ...prev]);
      }
  };

  if (!session || !currentUser) {
    return <Login brandingSettings={brandingSettings} />;
  }

  const currentOrg = organizations.find(o => o.id === currentUser.partnerOrganizationId) || null;

  const isAdminOrTreasury = currentUser.role === UserRole.Admin || currentUser.role === UserRole.Treasury;
  
  let notificationCount = 0;
  let notifications: { id: string, text: string, time: string }[] = [];

  if (isAdminOrTreasury) {
      const pendingQuotes = savedQuotes.filter(q => q.status === QuoteStatus.CreditPending);
      notificationCount = pendingQuotes.length;
      notifications = pendingQuotes.slice(0, 5).map(q => ({
          id: q.id,
          text: `Approval needed: ${q.customerName}`,
          time: q.creditRequestSubmittedAt || q.updatedAt
      }));
  } else {
      const recentDecisions = savedQuotes.filter(q => {
          if (q.createdByUserId !== currentUser.id) return false;
          if (q.status !== QuoteStatus.Accepted && q.status !== QuoteStatus.Rejected) return false;
          const updated = new Date(q.updatedAt);
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          return updated > threeDaysAgo;
      });
      notificationCount = recentDecisions.length;
      notifications = recentDecisions.slice(0, 5).map(q => ({
          id: q.id,
          text: `Quote ${q.status}: ${q.customerName}`,
          time: q.updatedAt
      }));
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <nav className="bg-white shadow-sm border-b border-slate-200 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {brandingSettings.appLogoBase64 ? (
                  <img src={brandingSettings.appLogoBase64} alt="Logo" className="h-8 w-auto" />
              ) : (
                  <span className="text-xl font-bold text-slate-800 tracking-tight">Calc.ai</span>
              )}
              
              <div className="hidden md:flex space-x-1 ml-8">
                <button onClick={() => setActiveView('calculator')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'calculator' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Calculator</button>
                <button onClick={() => setActiveView('tco')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'tco' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>TCO Analysis</button>
                {currentUser.role !== UserRole.Partner && (
                    <button onClick={() => setActiveView('admin')} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeView === 'admin' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>Admin</button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
               <div className="hidden md:block">
                   <CurrencySwitcher currentCurrency={quote.currency || 'EUR'} onCurrencyChange={c => setQuote({...quote, currency: c})} />
               </div>
               <div className="hidden md:block"><LanguageSwitcher /></div>
               
               <Dropdown trigger={
                   <div className="relative p-2 text-slate-500 hover:text-slate-700 transition-colors">
                       <BellIcon className="w-6 h-6" />
                       {notificationCount > 0 && (
                           <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border border-white">{notificationCount}</span>
                       )}
                   </div>
               }>
                   <div className="px-4 py-2 border-b border-gray-100 font-semibold text-xs text-gray-500 uppercase tracking-wide">Notifications</div>
                   {notifications.length > 0 ? (
                       notifications.map(n => (
                           <DropdownItem key={n.id} onClick={() => {}}>
                               <div><p className="text-sm font-medium text-gray-800">{n.text}</p><p className="text-xs text-gray-400">{new Date(n.time).toLocaleDateString()}</p></div>
                           </DropdownItem>
                       ))
                   ) : (<div className="px-4 py-3 text-sm text-gray-500 italic">No new notifications</div>)}
               </Dropdown>

               <div className="relative">
                   <Dropdown trigger={
                       <button className="flex items-center space-x-2 text-sm focus:outline-none group">
                            <span className="hidden md:block font-medium text-slate-700 group-hover:text-slate-900">{currentUser.name}</span>
                            <div className="h-8 w-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold border border-brand-200 group-hover:bg-brand-200 transition-colors">{currentUser.name.charAt(0)}</div>
                       </button>
                   }>
                       <div className="px-4 py-3 border-b border-gray-100"><p className="text-sm font-bold text-gray-900">{currentUser.name}</p><p className="text-xs text-gray-500 truncate">{currentUser.email}</p></div>
                       <DropdownItem onClick={() => setIsProfileOpen(true)}><UserCircleIcon className="w-4 h-4 text-gray-400" /><span>My Profile</span></DropdownItem>
                       <DropdownItem onClick={handleLogout}><LogoutIcon className="w-4 h-4 text-red-400" /><span className="text-red-600">Sign Out</span></DropdownItem>
                   </Dropdown>
               </div>
               
               <div className="md:hidden flex items-center">
                  <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-500 hover:text-slate-700"><MenuIcon /></button>
               </div>
            </div>
          </div>
        </div>
        
        {isMobileMenuOpen && (
            <div className="md:hidden bg-white border-t border-slate-100 p-2 space-y-1">
                <button onClick={() => { setActiveView('calculator'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50">Calculator</button>
                <button onClick={() => { setActiveView('tco'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50">TCO Analysis</button>
                {currentUser.role !== UserRole.Partner && (
                    <button onClick={() => { setActiveView('admin'); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50">Admin</button>
                )}
                <div className="border-t pt-2 mt-2">
                    <button onClick={() => { setIsProfileOpen(true); setIsMobileMenuOpen(false); }} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-50">My Profile</button>
                    <button onClick={handleLogout} className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50">Sign Out</button>
                </div>
            </div>
        )}
      </nav>

      <main className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {activeView === 'calculator' && (
            <CalculationSheet 
                quote={quote}
                setQuote={setQuote}
                lrfData={lrfData}
                savedQuotes={savedQuotes}
                onQuoteSave={handleSaveQuote}
                onQuoteDelete={handleDeleteQuote}
                createNewQuote={createNewQuote}
                currentUser={currentUser}
                profiles={profiles}
                tcoSettings={tcoSettings}
                templates={[]}
                onTemplateSave={async () => {}}
                onTemplateDelete={() => {}}
                workflowSettings={workflowSettings}
                addActivityLog={handleAddActivityLog}
                currentOrganization={currentOrg}
                onRefreshQuotes={fetchQuotes}
                exchangeRates={exchangeRates}
                priceViewMode={priceViewMode}
                setPriceViewMode={setPriceViewMode}
                brandingSettings={brandingSettings}
            />
        )}
        {activeView === 'tco' && (
            <TcoSheet 
                quote={quote}
                lrfData={lrfData}
                tcoSettings={tcoSettings}
                setTcoSettings={setTcoSettings}
                currentUser={currentUser}
                organization={currentOrg}
                exchangeRates={exchangeRates}
                priceViewMode={priceViewMode}
                brandingSettings={brandingSettings}
            />
        )}
        {activeView === 'admin' && currentUser.role !== UserRole.Partner && (
            <AdminSheet 
                profiles={profiles}
                onUserUpdate={handleUserUpdate}
                onUserCreate={handleUserCreate}
                onUserDelete={handleUserDelete}
                lrfData={lrfData}
                setLrfData={setLrfData}
                onSaveLrfData={handleSaveLrfData} // NEW PROP
                currentUser={currentUser}
                loginHistory={loginHistory}
                brandingSettings={brandingSettings}
                onSaveBrandingSettings={handleSaveBrandingSettings}
                savedQuotes={savedQuotes}
                workflowSettings={workflowSettings}
                setWorkflowSettings={setWorkflowSettings}
                activityLog={activityLog}
                tcoSettings={tcoSettings}
                setTcoSettings={setTcoSettings}
                onSaveTcoSettings={handleSaveTcoSettings}
                organizations={organizations}
                onOrganizationsUpdate={handleOrganizationsUpdate}
                addActivityLog={handleAddActivityLog}
                legalDocuments={legalDocuments}
                onLegalDocsUpdate={fetchLegalDocuments}
                exchangeRates={exchangeRates}
                exchangeRatesMeta={exchangeRatesMeta}
                onExchangeRatesUpdate={fetchExchangeRates}
            />
        )}
      </main>

      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center group"
          title="AI Assistant"
        >
          <QuestionMarkCircleIcon className="w-6 h-6 group-hover:animate-pulse" />
        </button>
      </div>

      <AiAssistant 
        isOpen={isAiAssistantOpen} 
        onClose={() => setIsAiAssistantOpen(false)} 
        currentUser={currentUser}
        activeView={activeView}
      />

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        user={currentUser}
        setUser={setCurrentUser}
      />
    </div>
  );
};

export default App;
