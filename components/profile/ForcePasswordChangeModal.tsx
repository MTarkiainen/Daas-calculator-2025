
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Profile } from '../../types';
import PasswordInput from '../ui/PasswordInput';
import { useLanguage } from '../../i18n/LanguageContext';

interface ForcePasswordChangeModalProps {
  user: Profile;
  onPasswordChanged: (userId: string, newPass: string) => void;
}

const ForcePasswordChangeModal: React.FC<ForcePasswordChangeModalProps> = ({ user, onPasswordChanged }) => {
  const { t } = useLanguage();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ key: string, message: string }[]>([]);
  const [mismatchError, setMismatchError] = useState(false);
  
  const validatePassword = (password: string): { key: string, message: string }[] => {
    const errors: { key: string, message: string }[] = [];
    if (password.length < 10) errors.push({ key: 'minLength', message: t('password.error.minLength')});
    if (!/[a-z]/.test(password)) errors.push({ key: 'lowercase', message: t('password.error.lowercase')});
    if (!/[A-Z]/.test(password)) errors.push({ key: 'uppercase', message: t('password.error.uppercase')});
    if (!/\d/.test(password)) errors.push({ key: 'number', message: t('password.error.number')});
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push({ key: 'specialChar', message: t('password.error.specialChar')});
    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMismatchError(false);
    setErrors([]);

    if (newPassword !== confirmPassword) {
      setMismatchError(true);
      return;
    }

    const validationErrors = validatePassword(newPassword);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onPasswordChanged(user.id, newPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
                {t('password.changeTitle')}
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
                {t('password.changeSubtitle')}
            </p>
        </div>
        <form className="mt-8 space-y-6 bg-white p-8 shadow-md rounded-xl" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
             <PasswordInput
                label={t('password.newPassword')}
                id="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <PasswordInput
                label={t('password.confirmNewPassword')}
                id="confirm-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
          </div>
          
          {(errors.length > 0 || mismatchError) && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative" role="alert">
                {mismatchError && <p>{t('password.error.mismatch')}</p>}
                {errors.length > 0 && (
                    <ul className="list-disc list-inside mt-1">
                        {errors.map(err => <li key={err.key}>{err.message}</li>)}
                    </ul>
                )}
            </div>
          )}

          <div>
            <Button type="submit" className="w-full">
              {t('password.updatePasswordButton')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChangeModal;
