

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CalculationItem, AssetType, OperatingSystem, Brand, Condition, LeaseTerm, AdditionalService, ServiceSelection } from '../../types';
import { ASSET_TYPE_KEYS, BRAND_KEYS, CONDITION_KEYS, LEASE_TERMS, ADDITIONAL_SERVICE_KEYS, BASE_HARDWARE_COSTS, RELEVANT_OS_MAP_KEYS, COUNTRIES } from '../../constants';
import ChevronLeftIcon from '../ui/icons/ChevronLeftIcon';
import ChevronRightIcon from '../ui/icons/ChevronRightIcon';
import { useLanguage } from '../../i18n/LanguageContext';

interface CalculationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<CalculationItem, 'id'>) => void;
  currency: string;
}

const getKeyByValue = (object: object, value: string) => {
  return Object.keys(object).find(key => object[key] === value);
};

const getFilteredOsKeys = (assetType: AssetType, brand: Brand): (keyof typeof OperatingSystem)[] => {
    const assetTypeKey = Object.keys(AssetType).find(k => AssetType[k] === assetType) as keyof typeof AssetType;
    if (!assetTypeKey) return [];

    const relevantOsKeys = RELEVANT_OS_MAP_KEYS[assetTypeKey];
    if (!relevantOsKeys) return [];

    if (brand === Brand.Apple) {
        if (assetType === AssetType.Laptop || assetType === AssetType.Desktop) {
            return ['MacOS'];
        }
        if (assetType === AssetType.Tablet || assetType === AssetType.Mobile) {
            return ['iOS'];
        }
    }
    
    // For non-Apple brands, remove Apple OS's from types where they don't apply.
    // Mobile is a special case where iOS can be an option for a non-Apple device (e.g. Brand 'Other')
    if (assetType === AssetType.Laptop || assetType === AssetType.Desktop || assetType === AssetType.Tablet) {
        return relevantOsKeys.filter(key => key !== 'MacOS' && key !== 'iOS');
    }

    // For Mobile (non-Apple), we want to return all relevant keys, which includes iOS.
    // For OtherIT/Accessory, they have no OS keys, so it will return [].
    return relevantOsKeys;
};

const initialFormState: Omit<CalculationItem, 'id'> = {
  assetType: AssetType.Laptop,
  operatingSystem: OperatingSystem.Windows,
  brand: Brand.HP,
  condition: Condition.New,
  leaseTerm: 24 as LeaseTerm,
  additionalServices: [] as ServiceSelection[],
  hardwareCost: BASE_HARDWARE_COSTS[AssetType.Laptop],
  quantity: 1,
  nonReturnPercentage: 0,
  customDescription: '',
  country: '',
};

const CalculationWizard: React.FC<CalculationWizardProps> = ({ isOpen, onClose, onAddItem, currency }) => {
  const { t, locale } = useLanguage();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };
  
  const availableOsKeys = useMemo(() => {
    return getFilteredOsKeys(formData.assetType, formData.brand);
  }, [formData.assetType, formData.brand]);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData(initialFormState);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    const currentOsKey = formData.operatingSystem ? getKeyByValue(OperatingSystem, formData.operatingSystem) : null;
    
    if (currentOsKey && !availableOsKeys.includes(currentOsKey as any)) {
        const newOsKey = availableOsKeys[0];
        const newOsValue = newOsKey ? OperatingSystem[newOsKey] : null;
        setFormData(prev => ({ ...prev, operatingSystem: newOsValue }));
    } else if (!currentOsKey && availableOsKeys.length > 0) {
        const newOsKey = availableOsKeys[0];
        const newOsValue = newOsKey ? OperatingSystem[newOsKey] : null;
        setFormData(prev => ({ ...prev, operatingSystem: newOsValue }));
    } else if (availableOsKeys.length === 0 && formData.operatingSystem) {
        setFormData(prev => ({ ...prev, operatingSystem: null }));
    }
}, [availableOsKeys, isOpen]);


  const handleAssetTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssetType = e.target.value as AssetType;
    setFormData({
      ...formData,
      assetType: newAssetType,
      hardwareCost: BASE_HARDWARE_COSTS[newAssetType] || 0
    });
  };
  
  const handleServiceToggle = (service: AdditionalService | 'Other') => {
    setFormData(prev => {
        const existingService = prev.additionalServices.find(s => s.service === service);
        if (existingService) {
            // Remove it
            return {
                ...prev,
                additionalServices: prev.additionalServices.filter(s => s.service !== service)
            };
        } else {
            // Add it with default values
            const newService: ServiceSelection = { service, cost: 0 };
            if (service === 'Other') {
                newService.description = '';
            }
            return {
                ...prev,
                additionalServices: [...prev.additionalServices, newService]
            };
        }
    });
  };

  const handleServiceValueChange = (service: AdditionalService | 'Other', field: 'cost' | 'description', value: string | number) => {
      setFormData(prev => ({
          ...prev,
          additionalServices: prev.additionalServices.map(s => {
              if (s.service === service) {
                  const updatedService = { ...s };
                  if (field === 'cost') updatedService.cost = typeof value === 'number' ? value : parseFloat(value) || 0;
                  if (field === 'description') updatedService.description = String(value);
                  return updatedService;
              }
              return s;
          })
      }));
  };

  const handleSubmit = () => {
    if (!formData.country) {
        alert("Please select a country for the asset in Step 1.");
        setStep(1);
        return;
    }
    onAddItem(formData);
    onClose();
  };

  const renderStepContent = () => {
    const nonReturnApplicableAssets: AssetType[] = [AssetType.Laptop, AssetType.Mobile, AssetType.Tablet];
    const isOtherAsset = formData.assetType === AssetType.OtherIT || formData.assetType === AssetType.Accessory;

    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
             <h3 className="text-lg font-medium text-gray-900">{t('calculation.wizard.step1.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label={t('calculation.wizard.assetType')} value={formData.assetType} onChange={handleAssetTypeChange}>
                {ASSET_TYPE_KEYS.map(typeKey => <option key={typeKey} value={AssetType[typeKey]}>{AssetType[typeKey]}</option>)}
              </Select>
              <Select label={t('calculation.wizard.brand')} value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value as Brand})}>
                {BRAND_KEYS.map(brandKey => <option key={brandKey} value={Brand[brandKey]}>{Brand[brandKey]}</option>)}
              </Select>
              <Select label={t('calculation.wizard.os')} value={formData.operatingSystem || ''} onChange={e => setFormData({...formData, operatingSystem: e.target.value as OperatingSystem})} disabled={availableOsKeys.length === 0}>
                <option value="">{availableOsKeys.length === 0 ? "N/A" : "Operating System"}</option>
                {availableOsKeys.map(osKey => <option key={osKey} value={OperatingSystem[osKey]}>{OperatingSystem[osKey]}</option>)}
              </Select>
              <Select label={t('calculation.wizard.condition')} value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as Condition})}>
                {CONDITION_KEYS.map(condKey => <option key={condKey} value={Condition[condKey]}>{Condition[condKey]}</option>)}
              </Select>
            </div>
            <Select 
                label={t('calculation.wizard.country')} 
                value={formData.country || ''} 
                onChange={e => setFormData({...formData, country: e.target.value})}
                required
            >
                <option value="">{t('calculation.wizard.selectCountry')}</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </Select>
            {isOtherAsset && (
                <Input 
                    label={t('calculation.wizard.customDescriptionLabel')} 
                    value={formData.customDescription || ''} 
                    onChange={e => setFormData({...formData, customDescription: e.target.value})}
                    placeholder={t('calculation.wizard.customDescriptionPlaceholder')}
                />
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label={t('calculation.wizard.hardwareCost', { currency })} type="number" value={formData.hardwareCost} onChange={e => setFormData({...formData, hardwareCost: parseFloat(e.target.value) || 0})} />
              <Input label={t('calculation.wizard.quantity')} type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value, 10) || 1})} />
            </div>
          </div>
        );
      case 2:
        const otherService = formData.additionalServices.find(s => s.service === 'Other');
        const isNonReturnApplied = (formData.nonReturnPercentage || 0) > 0;
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('calculation.wizard.step2.title')}</h3>
            <p className="text-sm text-slate-500 -mt-2">{t('calculation.wizard.step2.description')}</p>
            {nonReturnApplicableAssets.includes(formData.assetType) && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('calculation.wizard.nonReturnOption')}</label>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, nonReturnPercentage: isNonReturnApplied ? 0 : 5 })}
                        className="flex items-center cursor-pointer"
                    >
                        <div className="relative">
                            <div className={`block w-10 h-6 rounded-full transition-colors ${isNonReturnApplied ? 'bg-brand-600' : 'bg-gray-300'}`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isNonReturnApplied ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <div className="ml-3 text-sm text-gray-700">
                            {isNonReturnApplied ? `${t('common.yes')} (5%)` : t('common.no')}
                        </div>
                    </button>
                </div>
            )}
            <div className="space-y-3">
                {ADDITIONAL_SERVICE_KEYS.map(serviceKey => {
                    const serviceValue = AdditionalService[serviceKey];
                    const selection = formData.additionalServices.find(s => s.service === serviceValue);
                    return (
                        <div key={serviceKey} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                    checked={!!selection}
                                    onChange={() => handleServiceToggle(serviceValue)}
                                />
                                <span className="text-sm text-gray-700 flex-grow">{t(`enums.AdditionalService.${serviceKey}`, { defaultValue: serviceValue })}</span>
                                {selection && (
                                    <div className="w-40 flex items-center">
                                      <Input type="number" placeholder={t('common.cost')} value={selection.cost} onChange={e => handleServiceValueChange(serviceValue, 'cost', e.target.value)} />
                                      <span className="ml-2 text-gray-500">{currency}</span>
                                    </div>
                                )}
                            </label>
                            {serviceValue === AdditionalService.Support && selection && (
                                <p className="pl-7 pt-1 text-xs text-slate-500">{t('calculation.wizard.step2.supportHelpText')}</p>
                            )}
                        </div>
                    );
                })}
                <div className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                   <label className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={!!otherService} onChange={() => handleServiceToggle('Other')} />
                      <span className="text-sm text-gray-700 font-semibold">{t('calculation.wizard.step2.otherServiceDescription')}</span>
                   </label>
                   {otherService && (
                      <div className="mt-3 space-y-3 pl-7">
                        <Input label={t('common.description')} placeholder={t('calculation.wizard.step2.otherServicePlaceholder')} value={otherService.description || ''} onChange={e => handleServiceValueChange('Other', 'description', e.target.value)} />
                        <Input label={t('common.costInCurrency', { currency })} type="number" value={otherService.cost} onChange={e => handleServiceValueChange('Other', 'cost', e.target.value)} />
                      </div>
                   )}
                </div>
            </div>
          </div>
        );
      case 3:
         const servicesCost = formData.additionalServices.reduce((sum, service) => sum + service.cost, 0);
         const totalUnitCost = formData.hardwareCost + servicesCost;
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">{t('calculation.wizard.step3.title')}</h3>
            <Select label={t('calculation.wizard.leaseTerm')} value={formData.leaseTerm} onChange={e => setFormData({...formData, leaseTerm: parseInt(e.target.value, 10) as LeaseTerm})}>
              {LEASE_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
            </Select>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="font-semibold text-gray-800 mb-2">{t('calculation.wizard.step3.summaryTitle')}</h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <span className="text-gray-600">{t('calculation.wizard.step3.asset')}:</span> <span className="text-gray-800 font-medium">{formData.assetType} - {formData.brand}</span>
                    <span className="text-gray-600">{t('calculation.wizard.step3.quantity')}:</span> <span className="text-gray-800 font-medium">{formData.quantity.toLocaleString(locale)}</span>
                    <span className="text-gray-600">{t('calculation.wizard.step3.totalUnitCost')}:</span> <span className="text-gray-800 font-medium">{formatCurrency(totalUnitCost)}</span>
                    <span className="text-gray-600">{t('calculation.wizard.step3.leaseTerm')}:</span> <span className="text-gray-800 font-medium">{formData.leaseTerm} {t('common.months')}</span>
                </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('calculation.wizard.title')}>
      <div>
        {renderStepContent()}
      </div>
      <div className="mt-6 flex justify-between items-center">
        <div>
            <Button variant="secondary" onClick={() => setStep(s => s - 1)} disabled={step === 1} leftIcon={<ChevronLeftIcon />}>{t('common.back')}</Button>
        </div>
        <span className="text-sm text-gray-500">{t('common.step', { current: step, total: 3 })}</span>
        <div>
        {step < 3 && <Button onClick={() => setStep(s => s + 1)} rightIcon={<ChevronRightIcon />}>{t('common.next')}</Button>}
        {step === 3 && <Button onClick={handleSubmit}>{t('calculation.wizard.submitButton')}</Button>}
        </div>
      </div>
    </Modal>
  );
};

export default CalculationWizard;