import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { BrandingSettings } from '../types';
import TermsModal from './legal/TermsModal';
import { supabase } from '../supabaseClient';
import PasswordInput from './ui/PasswordInput';
import CompanyLogo from './ui/icons/CompanyLogo';
import { useLanguage } from '../i18n/LanguageContext';
import PasswordResetModal from './auth/PasswordResetModal';

interface LoginProps {
  brandingSettings: BrandingSettings;
}

const Login: React.FC<LoginProps> = ({ brandingSettings }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('login.error.bothFieldsRequired'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(t('login.error.invalidCredentials'));
    }
    setLoading(false);
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {brandingSettings.appLogoBase64 ? (
              <img src={brandingSettings.appLogoBase64} alt="Company Logo" className="mx-auto h-24 w-auto object-contain" />
            ) : (
              <CompanyLogo className="mx-auto h-24 w-auto text-chg-blue" />
            )}
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
              {t('login.subtitle')}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              {t('login.title')}
            </p>
          </div>
          <form className="mt-8 space-y-6 bg-white p-8 shadow-md rounded-xl" onSubmit={handleSubmit} autoComplete="off">
            <div className="rounded-md shadow-sm space-y-4">
              <Input
                label={t('login.emailPlaceholder')}
                id="email-address"
                name="email"
                type="email"
                autoComplete="off" 
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <div>
                <PasswordInput
                    label={t('login.passwordPlaceholder')}
                    id="password"
                    name="password"
                    autoComplete="off"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                 <div className="text-right mt-2">
                    <button
                        type="button"
                        onClick={() => setIsResetModalOpen(true)}
                        className="text-sm font-medium text-chg-active-blue hover:text-brand-500 underline rounded-md px-1 py-0.5 hover:bg-blue-50 transition-colors"
                    >
                        {t('login.forgotPassword')}
                    </button>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="h-4 w-4 text-chg-active-blue focus:ring-brand-500 border-slate-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="text-slate-700">
                  {t('legal.checkboxLabel')}{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="font-medium text-chg-active-blue hover:text-brand-500 underline"
                  >
                    {t('legal.termsLink')}
                  </button>
                  .
                </label>
              </div>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div>
              <Button type="submit" className="w-full" disabled={!acceptedTerms || loading}>
                {loading ? t('common.saving') : t('login.signInButton')}
              </Button>
            </div>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">
              {t('app.copyright', { year: new Date().getFullYear() })}
          </p>
        </div>
      </div>
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <PasswordResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
    </>
  );
};

export default Login;