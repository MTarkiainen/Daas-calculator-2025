import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLanguage } from '../../i18n/LanguageContext';
import CopyIcon from '../ui/icons/CopyIcon';
import CheckCircleIcon from '../ui/icons/CheckCircleIcon';
import SparklesIcon from '../ui/icons/SparklesIcon';

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryText: string;
  isLoading: boolean;
}

const AiSummaryModal: React.FC<AiSummaryModalProps> = ({ isOpen, onClose, summaryText, isLoading }) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);
    
    useEffect(() => {
        if (!isOpen) {
            // Reset copied state when modal closes
            setTimeout(() => setCopied(false), 300);
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(summaryText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={t('aiSummary.modalTitle')}
            footer={
                <div className="flex justify-between items-center w-full">
                    <Button variant="secondary" onClick={onClose}>{t('common.close')}</Button>
                    <Button onClick={handleCopy} disabled={isLoading || !summaryText} leftIcon={copied ? <CheckCircleIcon /> : <CopyIcon />}>
                        {copied ? t('aiSummary.copied') : t('aiSummary.copyButton')}
                    </Button>
                </div>
            }
        >
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-48 bg-slate-50 rounded-lg">
                        <SparklesIcon className="w-10 h-10 text-chg-active-blue animate-pulse" />
                        <p className="mt-4 text-sm font-medium text-slate-600">{t('aiSummary.loadingText')}</p>
                    </div>
                ) : (
                    <textarea
                        readOnly
                        value={summaryText}
                        rows={10}
                        className="block w-full text-sm border-slate-300 rounded-md shadow-sm bg-slate-50 focus:ring-0 focus:border-slate-300"
                    />
                )}
            </div>
        </Modal>
    );
};

export default AiSummaryModal;
