

import React from 'react';
import { CalculationItem, AssetType, Brand, OperatingSystem, Condition, AdditionalService, PriceViewMode } from '../../types';
import TrashIcon from '../ui/icons/TrashIcon';
import DuplicateIcon from '../ui/icons/DuplicateIcon';
import { useLanguage } from '../../i18n/LanguageContext';

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

interface CalculationRowProps {
  item: CalculationItem;
  leaseRateFactor: number;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  priceViewMode: PriceViewMode;
  currency: string;
}

const CalculationRow: React.FC<CalculationRowProps> = ({ item, leaseRateFactor, onRemove, onEdit, onDuplicate, priceViewMode, currency }) => {
  const { t, locale } = useLanguage();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };

  const monthlyHardwareCostPerUnit = item.hardwareCost * leaseRateFactor;
  const totalMonthlyCost = monthlyHardwareCostPerUnit * item.quantity;
  const totalServicesCostPerUnit = item.additionalServices.reduce((sum, service) => sum + service.cost, 0);
  const totalLeaseCostPerUnit = (monthlyHardwareCostPerUnit * item.leaseTerm) + totalServicesCostPerUnit;
  const totalLeaseCost = totalLeaseCostPerUnit * item.quantity;
  
  // Bundled calculations
  const monthlyServicesCostPerUnit = totalServicesCostPerUnit / item.leaseTerm;
  const bundledMonthlyCostPerUnit = monthlyHardwareCostPerUnit + monthlyServicesCostPerUnit;
  const totalMonthlyBundled = bundledMonthlyCostPerUnit * item.quantity;
  const totalBundledCostPerUnit = bundledMonthlyCostPerUnit * item.leaseTerm;
  const totalBundledCost = totalBundledCostPerUnit * item.quantity;

  const isOtherAsset = item.assetType === AssetType.OtherIT || item.assetType === AssetType.Accessory;

  return (
    <tr>
      <td className="px-4 py-4 whitespace-nowrap align-top">
        <div className="text-sm font-medium text-slate-900">{item.assetType}</div>
        {isOtherAsset && item.customDescription ? (
          <div className="text-sm text-slate-700 font-semibold">{item.customDescription}</div>
        ) : (
          <div className="text-sm text-slate-500">{item.brand}</div>
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 align-top">
        <div className="font-semibold text-slate-800">{t('calculation.table.country')}: {item.country || 'N/A'}</div>
        {!isOtherAsset ? (
            <>
                <div>{t('calculation.table.os')}: {item.operatingSystem || t('common.na')}</div>
                <div>{t('calculation.table.condition')}: {item.condition}</div>
            </>
        ) : (
            <div>{t('calculation.table.condition')}: {item.condition}</div>
        )}

        {(item.nonReturnPercentage || 0) > 0 && (
          <div className="font-semibold text-slate-700">{t('calculation.table.nonReturn')}: {t('common.yes')} (5%)</div>
        )}
        {item.additionalServices.length > 0 && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-600">{t('calculation.table.servicesLabel')}:</span>
            <ul className="list-disc list-inside text-xs text-slate-800 mt-1">
              {item.additionalServices.map((s, i) => {
                return (
                  <li key={i}>
                    {s.service === 'Other' ? s.description || "Other Service" : s.service}
                    {priceViewMode === 'detailed' && `: ${formatCurrency(s.cost)}`}
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </td>
      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-500 align-top">{item.leaseTerm} {t('common.monthsShort')}</td>
      <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-slate-500 align-top">{item.quantity.toLocaleString(locale)}</td>
      
      {priceViewMode === 'detailed' ? (
        <>
          <td className="px-4 py-4 whitespace-nowrap text-right align-top">
            <div className="text-sm font-medium text-slate-900">{formatCurrency(totalMonthlyCost)}</div>
            <div className="text-xs text-slate-500">{formatCurrency(monthlyHardwareCostPerUnit)} / {t('calculation.table.unit')}</div>
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-right align-top">
            <div className="text-sm font-medium text-slate-900">{formatCurrency(totalLeaseCost)}</div>
            <div className="text-xs text-slate-500">{formatCurrency(totalLeaseCostPerUnit)} / {t('calculation.table.unit')}</div>
          </td>
        </>
      ) : (
        <>
          <td className="px-4 py-4 whitespace-nowrap text-right align-top">
            <div className="text-sm font-medium text-slate-900">{formatCurrency(totalMonthlyBundled)}</div>
            <div className="text-xs text-slate-500">{formatCurrency(bundledMonthlyCostPerUnit)} / {t('calculation.table.unit')}</div>
          </td>
          <td className="px-4 py-4 whitespace-nowrap text-right align-top">
            <div className="text-sm font-medium text-slate-900">{formatCurrency(totalBundledCost)}</div>
            <div className="text-xs text-slate-500">{formatCurrency(totalBundledCostPerUnit)} / {t('calculation.table.unit')}</div>
          </td>
        </>
      )}

      <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium align-top">
        <div className="flex items-center justify-center space-x-1">
            <button onClick={() => onDuplicate(item.id)} className="text-slate-500 hover:text-slate-800 p-2 rounded-full hover:bg-slate-100" aria-label={t('calculation.actions.duplicate')}>
                <DuplicateIcon />
            </button>
            <button onClick={() => onEdit(item.id)} className="text-chg-active-blue hover:text-brand-900 p-2 rounded-full hover:bg-brand-50" aria-label={t('calculation.actions.edit')}>
                <EditIcon />
            </button>
            <button onClick={() => onRemove(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100" aria-label={t('calculation.actions.remove')}>
                <TrashIcon />
            </button>
        </div>
      </td>
    </tr>
  );
};

export default CalculationRow;