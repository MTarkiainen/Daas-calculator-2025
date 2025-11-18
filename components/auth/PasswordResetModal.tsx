import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../supabaseClient';
import { useLanguage } from '../../i18n/LanguageContext';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // URL to redirect to after password reset
    });

    if (error) {
      setError(t('login.resetModal.error'));
      console.error('Password reset error:', error);
    } else {
      setMessage(t('login.resetModal.success'));
    }

    setLoading(false);
  };
  
  const handleClose = () => {
    // Reset state when closing
    setEmail('');
    setMessage('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('login.resetModal.title')}>
      {!message ? (
        <form onSubmit={handleResetRequest} className="space-y-4">
          <p className="text-sm text-slate-600">{t('login.resetModal.instructions')}</p>
          <Input
            label={t('login.resetModal.emailLabel')}
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={loading || !email}>
              {loading ? t('common.loading') : t('login.resetModal.sendButton')}
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <p className="text-sm text-green-700 bg-green-100 p-4 rounded-lg">{message}</p>
        </div>
      )}
    </Modal>
  );
};

export default PasswordResetModal;