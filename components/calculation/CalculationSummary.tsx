

import React from 'react';
import { PriceViewMode } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface CalculationSummaryProps {
  totalHardwareCost: number;
  totalServicesCost: number;
  totalMonthlyCost: number;
  totalLeaseCost: number;
  priceViewMode: PriceViewMode;
  totalMonthlyBundled: number;
  totalLeaseBundled: number;
  currency: string;
}

const CalculationSummary: React.FC<CalculationSummaryProps> = ({ 
  totalHardwareCost, 
  totalServicesCost, 
  totalMonthlyCost, 
  totalLeaseCost, 
  priceViewMode,
  totalMonthlyBundled,
  totalLeaseBundled,
  currency,
}) => {
  const { t, locale } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };
  
  if (priceViewMode === 'bundled') {
    return (
      <div className="mt-6 pt-4 border-t">
        <div className="flex flex-col md:flex-row justify-end md:space-x-8 items-end gap-4">
           <div className="text-right">
              <p className="text-sm text-slate-500">{t('summary.totalMonthlyBundled')}</p>
              <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalMonthlyBundled)}</p>
           </div>
           <div className="text-right">
              <p className="text-sm text-slate-500">{t('summary.totalBundledCost')}</p>
              <p className="text-2xl font-semibold text-chg-active-blue">{formatCurrency(totalLeaseBundled)}</p>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 pt-4 border-t">
      <div className="flex flex-col md:flex-row justify-end md:space-x-8 items-end gap-4">
        <div className="text-right text-sm text-slate-600 w-full md:w-auto">
          <div className="flex justify-between">
            <span>{t('summary.hardwareValue')}:</span>
            <span className="ml-4 font-medium">{formatCurrency(totalHardwareCost)}</span>
          </div>
          <div className="flex justify-between">
            <span>{t('summary.oneTimeServices')}:</span>
            <span className="ml-4 font-medium">{formatCurrency(totalServicesCost)}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">{t('summary.totalMonthlyCost')}</p>
          <p className="text-2xl font-semibold text-slate-900">{formatCurrency(totalMonthlyCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-500">{t('summary.totalLeaseCost')}</p>
          <p className="text-2xl font-semibold text-chg-active-blue">{formatCurrency(totalLeaseCost)}</p>
        </div>
      </div>
    </div>
  );
};

export default CalculationSummary;