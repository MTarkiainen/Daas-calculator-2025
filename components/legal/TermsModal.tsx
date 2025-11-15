
import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import TermsAndConditions from './TermsAndConditions';
import { useLanguage } from '../../i18n/LanguageContext';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('legal.modal.title')}
      footer={
        <Button onClick={onClose} variant="secondary">
          {t('legal.modal.close')}
        </Button>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        <TermsAndConditions />
      </div>
    </Modal>
  );
};

export default TermsModal;
