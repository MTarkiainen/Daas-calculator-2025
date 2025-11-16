
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TcoSuggestion, TcoSettings } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import InformationCircleIcon from '../ui/icons/InformationCircleIcon';

interface TcoTuningModalProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: TcoSuggestion[];
  currentSettings: TcoSettings;
  onApply: (selectedSuggestions: TcoSuggestion[]) => void;
}

const TcoTuningModal: React.FC<TcoTuningModalProps> = ({ isOpen, onClose, suggestions, currentSettings, onApply }) => {
  const { t } = useLanguage();
  const [selectedParams, setSelectedParams] = useState<Set<keyof TcoSettings>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Pre-select all suggestions by default when the modal opens
      setSelectedParams(new Set(suggestions.map(s => s.parameter)));
    }
  }, [isOpen, suggestions]);

  const handleToggle = (param: keyof TcoSettings) => {
    setSelectedParams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(param)) {
        newSet.delete(param);
      } else {
        newSet.add(param);
      }
      return newSet;
    });
  };

  const handleApply = () => {
    const selectedSuggestions = suggestions.filter(s => selectedParams.has(s.parameter));
    onApply(selectedSuggestions);
  };
  
  const getParameterLabel = (param: keyof TcoSettings): string => {
    const keyMap: Record<keyof TcoSettings, string> = {
        selectedIndustry: '', useCustomWacc: '', customWacc: '',
        deploymentCostPerDevice: t('tco.assumptions.deploymentCost'),
        itSupportHoursPerDeviceYear: t('tco.assumptions.supportHours'),
        itStaffHourlyRate: t('tco.assumptions.staffRate'),
        failuresPerDeviceYear: t('tco.assumptions.failures'),
        downtimeHoursPerFailure: t('tco.assumptions.downtimeHours'),
        employeeCostPerHour: t('tco.assumptions.employeeCost'),
        eoldCostPerDevice: t('tco.assumptions.eoldCost'),
        residualValuePercentage: t('tco.assumptions.residualValue'),
    };
    return keyMap[param] || param;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('tco.tuning.modalTitle')}
      footer={
        <div className="flex justify-between w-full items-center">
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={handleApply} disabled={selectedParams.size === 0}>
            {t('tco.tuning.applyButton', { count: selectedParams.size })}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <p className="text-sm text-slate-600">{t('tco.tuning.description')}</p>
        
        {suggestions.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 rounded-lg">
                <InformationCircleIcon className="w-8 h-8 mx-auto text-slate-400" />
                <p className="mt-2 text-sm text-slate-600">{t('tco.tuning.noSuggestions')}</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="w-8"></th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tco.tuning.table.parameter')}</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tco.tuning.table.current')}</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tco.tuning.table.suggested')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                        {suggestions.map((s, index) => (
                            <React.Fragment key={index}>
                                <tr>
                                    <td className="p-2 align-top">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 mt-1 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                            checked={selectedParams.has(s.parameter)}
                                            onChange={() => handleToggle(s.parameter)}
                                        />
                                    </td>
                                    <td className="px-4 py-3 align-top">
                                        <div className="text-sm font-semibold text-slate-800">{getParameterLabel(s.parameter)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm text-slate-500 align-top">
                                        {(currentSettings as any)[s.parameter]}
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-chg-active-blue align-top">
                                        {s.suggestedValue}
                                    </td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td colSpan={3} className="px-4 pb-3">
                                        <p className="text-xs text-slate-600 italic">
                                            <span className="font-semibold">{t('tco.tuning.table.reasoning')}:</span> {s.reasoning}
                                        </p>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>
    </Modal>
  );
};

export default TcoTuningModal;