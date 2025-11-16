

import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CalculationItem, LeaseRateFactorsMap, Quote, Condition, LeaseRateFactorsData, Profile, TcoSettings, AssetType, OperatingSystem, Brand, LeaseTerm, ServiceSelection, AdditionalService, Template, QuoteOption, UserRole, PriceViewMode, WorkflowSettings, ActivityType, QuoteStatus } from '../../types';
// FIX: Corrected typo in constant name from USED_AS_SET_LRF_KEY to USED_ASSET_LRF_KEY.
import { USED_ASSET_LRF_KEY, INDUSTRIES_WACC, ASSET_TYPE_KEYS, OPERATING_SYSTEM_KEYS, BRAND_KEYS, CONDITION_KEYS, LEASE_TERMS, ADDITIONAL_SERVICE_KEYS, BASE_HARDWARE_COSTS, RELEVANT_OS_MAP_KEYS, COUNTRIES } from '../../constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import PlusIcon from '../ui/icons/PlusIcon';
import FolderOpenIcon from '../ui/icons/FolderOpenIcon';
import DocumentDownloadIcon from '../ui/icons/DocumentDownloadIcon';
import SaveIcon from '../ui/icons/SaveIcon';
import CalculationWizard from './CalculationWizard';
import CalculationRow from './CalculationRow';
import CalculationSummary from './CalculationSummary';
import QuoteDashboardModal from './SaveLoadModal';
import LrfValidityIndicator from './LrfValidityIndicator';
import SegmentedControl from '../ui/SegmentedControl';
import CreditRequestModal from './CreditRequestModal';
import CheckCircleIcon from '../ui/icons/CheckCircleIcon';
import { useLanguage } from '../../i18n/LanguageContext';
import { calculateTco, getLeaseRateFactor } from '../../utils/calculationUtils';
import AiSummaryModal from '../ai/AiSummaryModal';
import SparklesIcon from '../ui/icons/SparklesIcon';
import { GoogleGenAI } from '@google/genai';

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

// MODALS
const EditItemModal: React.FC<{isOpen: boolean; onClose: () => void; onUpdateItem: (item: CalculationItem) => void; item: CalculationItem; currency: string;}> = ({ isOpen, onClose, onUpdateItem, item, currency }) => {
  const [formState, setFormState] = useState<CalculationItem>(item);
  const { t } = useLanguage();
  
  const availableOsKeys = useMemo(() => {
    return getFilteredOsKeys(formState.assetType, formState.brand);
  }, [formState.assetType, formState.brand]);

  useEffect(() => { if (item && isOpen) setFormState(item); }, [item, isOpen]);
  
  useEffect(() => {
    if (!isOpen) return;
    const currentOsKey = formState.operatingSystem ? getKeyByValue(OperatingSystem, formState.operatingSystem) : null;
    
    if (currentOsKey && !availableOsKeys.includes(currentOsKey as any)) {
        const newOsKey = availableOsKeys[0];
        const newOsValue = newOsKey ? OperatingSystem[newOsKey] : null;
        setFormState(prev => ({ ...prev, operatingSystem: newOsValue }));
    } else if (!currentOsKey && availableOsKeys.length > 0) {
        const newOsKey = availableOsKeys[0];
        const newOsValue = newOsKey ? OperatingSystem[newOsKey] : null;
        setFormState(prev => ({ ...prev, operatingSystem: newOsValue }));
    } else if (availableOsKeys.length === 0 && formState.operatingSystem) {
        setFormState(prev => ({ ...prev, operatingSystem: null }));
    }
}, [availableOsKeys, formState.operatingSystem, isOpen]);
  
  const handleAssetTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAssetType = e.target.value as AssetType;
    setFormState(prev => ({ ...prev, assetType: newAssetType, hardwareCost: BASE_HARDWARE_COSTS[newAssetType] || 0 }));
  };
  
  const handleServiceToggle = (service: AdditionalService | 'Other') => {
    const exists = formState.additionalServices.some(s => s.service === service);
    const additionalServices = exists
      ? formState.additionalServices.filter(s => s.service !== service)
      : [...formState.additionalServices, { service, cost: 0, ...(service === 'Other' && { description: '' }) }];
    setFormState(prev => ({ ...prev, additionalServices }));
  };

  const handleServiceValueChange = (service: AdditionalService | 'Other', field: 'cost' | 'description', value: string | number) => {
    setFormState(prev => ({ ...prev, additionalServices: prev.additionalServices.map(s => s.service === service ? { ...s, [field]: value } : s) }));
  };

  const handleSubmit = () => { 
    if (!formState.country) {
        alert("Country is a required field for each asset.");
        return;
    }
    onUpdateItem(formState); 
    onClose(); 
  };
  
  const otherService = formState.additionalServices.find(s => s.service === 'Other');
  const nonReturnApplicableAssets: AssetType[] = [AssetType.Laptop, AssetType.Mobile, AssetType.Tablet];
  const isNonReturnApplied = (formState.nonReturnPercentage || 0) > 0;
  const isOtherAsset = formState.assetType === AssetType.OtherIT || formState.assetType === AssetType.Accessory;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('calculation.editModal.title')}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label={t('calculation.wizard.assetType')} value={formState.assetType} onChange={handleAssetTypeChange}>
            {ASSET_TYPE_KEYS.map(typeKey => <option key={typeKey} value={AssetType[typeKey]}>{AssetType[typeKey]}</option>)}
          </Select>
          <Select label={t('calculation.wizard.brand')} value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value as Brand})}>
            {BRAND_KEYS.map(brandKey => <option key={brandKey} value={Brand[brandKey]}>{Brand[brandKey]}</option>)}
          </Select>
          <Select label={t('calculation.wizard.os')} value={formState.operatingSystem || ''} onChange={e => setFormState({...formState, operatingSystem: e.target.value as OperatingSystem})} disabled={availableOsKeys.length === 0}>
            <option value="">{availableOsKeys.length === 0 ? t('common.na') : t('calculation.wizard.os')}</option>
            {availableOsKeys.map(osKey => <option key={osKey} value={OperatingSystem[osKey]}>{OperatingSystem[osKey]}</option>)}
          </Select>
          <Select label={t('calculation.wizard.condition')} value={formState.condition} onChange={e => setFormState({...formState, condition: e.target.value as Condition})}>
            {CONDITION_KEYS.map(condKey => <option key={condKey} value={Condition[condKey]}>{Condition[condKey]}</option>)}
          </Select>
        </div>

        <Select 
            label={t('calculation.wizard.country')} 
            value={formState.country || ''} 
            onChange={e => setFormState({...formState, country: e.target.value})}
            required
        >
            <option value="">{t('calculation.wizard.selectCountry')}</option>
            {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
        </Select>
        
        {isOtherAsset && (
            <Input 
                label={t('calculation.wizard.customDescriptionLabel')}
                value={formState.customDescription || ''} 
                onChange={e => setFormState({...formState, customDescription: e.target.value})}
                placeholder={t('calculation.wizard.customDescriptionPlaceholder')}
            />
        )}

        <Input label={t('calculation.wizard.hardwareCost', { currency })} type="number" value={formState.hardwareCost} onChange={e => setFormState({...formState, hardwareCost: parseFloat(e.target.value) || 0})} />
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('calculation.editModal.servicesLabel')}</label>
            <p className="text-xs text-slate-500 mb-2">{t('calculation.wizard.step2.description')}</p>
            <div className="space-y-2">
                {ADDITIONAL_SERVICE_KEYS.map(serviceKey => {
                    const serviceValue = AdditionalService[serviceKey];
                    const selection = formState.additionalServices.find(s => s.service === serviceValue);
                    return (
                        <div key={serviceKey} className="p-2 border rounded-md">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={!!selection} onChange={() => handleServiceToggle(serviceValue)} />
                                <span className="text-sm text-gray-700 flex-grow">{t(`enums.AdditionalService.${serviceKey}`, { defaultValue: serviceValue })}</span>
                                {selection && (<div className="w-32"><Input type="number" placeholder={t('common.costInCurrency', { currency })} value={selection.cost} onChange={e => handleServiceValueChange(serviceValue, 'cost', e.target.value)} /></div>)}
                            </label>
                            {serviceValue === AdditionalService.Support && selection && (
                                <p className="pl-6 pt-1 text-xs text-slate-500">{t('calculation.wizard.step2.supportHelpText')}</p>
                            )}
                        </div>
                    )
                })}
                <div className="p-2 border rounded-md">
                   <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={!!otherService} onChange={() => handleServiceToggle('Other')} /><span className="text-sm text-gray-700">{t('calculation.wizard.step2.otherServiceDescription')}</span></label>
                   {otherService && (<div className="mt-2 space-y-2 pl-6"><Input label={t('common.description')} value={otherService.description || ''} onChange={e => handleServiceValueChange('Other', 'description', e.target.value)} /><Input label={t('common.costInCurrency', { currency })} type="number" value={otherService.cost} onChange={e => handleServiceValueChange('Other', 'cost', e.target.value)} /></div>)}
                </div>
            </div>
        </div>

        {nonReturnApplicableAssets.includes(formState.assetType) && (
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('calculation.wizard.nonReturnOption')}</label>
                <button
                    type="button"
                    onClick={() => setFormState({ ...formState, nonReturnPercentage: isNonReturnApplied ? 0 : 5 })}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label={t('calculation.wizard.leaseTerm')} value={formState.leaseTerm} onChange={e => setFormState({...formState, leaseTerm: parseInt(e.target.value, 10) as LeaseTerm})}>
            {LEASE_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
          </Select>
          <Input label={t('calculation.wizard.quantity')} type="number" min="1" value={formState.quantity} onChange={e => setFormState({...formState, quantity: parseInt(e.target.value, 10) || 1})} />
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleSubmit}>{t('common.saveChanges')}</Button>
      </div>
    </Modal>
  );
};



// PROPS
interface CalculationSheetProps {
  lrfData: LeaseRateFactorsData;
  quote: Quote;
  setQuote: React.Dispatch<React.SetStateAction<Quote>>;
  savedQuotes: Quote[];
  onQuoteSave: (quote: Quote) => Promise<void>;
  onQuoteDelete: (id: string) => Promise<void>;
  createNewQuote: () => Quote;
  currentUser: Profile;
  profiles: Profile[];
  tcoSettings: TcoSettings;
  templates: Template[];
  onTemplateSave: (template: Omit<Template, 'id'>) => Promise<void>;
  onTemplateDelete: (id: string) => Promise<void>;
  workflowSettings: WorkflowSettings;
  addActivityLog: (type: ActivityType, details: string, quoteContext?: Quote) => void;
}


const CalculationSheet: React.FC<CalculationSheetProps> = ({ 
    lrfData, quote, setQuote, savedQuotes, onQuoteSave, onQuoteDelete, createNewQuote, 
    currentUser, profiles, tcoSettings, templates, onTemplateSave, onTemplateDelete, workflowSettings, addActivityLog
}) => {
  const { t, locale } = useLanguage();
  const [activeOptionId, setActiveOptionId] = useState<string>(quote.options[0]?.id);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<CalculationItem | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [priceViewMode, setPriceViewMode] = useState<PriceViewMode>('detailed');

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  useEffect(() => { if (quote.options.length > 0 && !quote.options.find(o => o.id === activeOptionId)) setActiveOptionId(quote.options[0].id); }, [quote, activeOptionId]);
  
  const activeOption = quote.options.find(o => o.id === activeOptionId);
  const isPartner = currentUser.role === UserRole.Partner;

  const updateOption = (optionId: string, updatedItems: CalculationItem[]) => {
    setQuote(q => ({ ...q, options: q.options.map(o => o.id === optionId ? { ...o, items: updatedItems } : o) }));
  };

  const addItem = (item: Omit<CalculationItem, 'id'>) => {
    if (!activeOption) return;
    const newItem: CalculationItem = { ...item, id: uuidv4() };
    updateOption(activeOption.id, [...activeOption.items, newItem]);
  };

  const removeItem = (id: string) => activeOption && updateOption(activeOption.id, activeOption.items.filter(i => i.id !== id));
  const duplicateItem = (id: string) => {
    if (!activeOption) return;
    const itemToCopy = activeOption.items.find(i => i.id === id);
    if (itemToCopy) {
      const { id: _, ...itemData } = itemToCopy;
      addItem(itemData);
    }
  };
  const updateItem = (updatedItem: CalculationItem) => activeOption && updateOption(activeOption.id, activeOption.items.map(i => i.id === updatedItem.id ? updatedItem : i));
  const handleQuoteFieldChange = (field: keyof Pick<Quote, 'customerName' | 'projectName' | 'expectedStartDate'>, value: string) => {
    setQuote(q => ({ ...q, [field]: value }));
  };

  const addOption = () => {
    // Find the next available letter for the option name
    const existingLetters = new Set(
      quote.options.map(o => {
        // Extracts the last capital letter from the option name
        const match = o.name.match(/([A-Z])$/);
        return match ? match[1] : '';
      })
    );

    let nextLetter = 'A';
    // Increment the letter until a free one is found
    while (existingLetters.has(nextLetter)) {
      nextLetter = String.fromCharCode(nextLetter.charCodeAt(0) + 1);
    }
    
    const newOption: QuoteOption = { 
      id: uuidv4(), 
      name: `${t('calculation.option')} ${nextLetter}`, 
      items: [] 
    };

    const activeIndex = quote.options.findIndex(o => o.id === activeOptionId);
    const insertionIndex = activeIndex > -1 ? activeIndex + 1 : quote.options.length;

    const newOptions = [...quote.options];
    newOptions.splice(insertionIndex, 0, newOption);

    setQuote(q => ({ ...q, options: newOptions }));
    setActiveOptionId(newOption.id);
  };

  const removeOption = (optionId: string) => {
    if (quote.options.length <= 1) {
      alert(t('calculation.error.cannotDeleteLastOption'));
      return;
    }
    if (!window.confirm(t('calculation.confirm.deleteOption'))) return;
    
    const optionIndexToRemove = quote.options.findIndex(o => o.id === optionId);
    if (optionIndexToRemove === -1) return; // safety check

    const newOptions = quote.options.filter(o => o.id !== optionId);
    setQuote(q => ({ ...q, options: newOptions }));
    
    if (activeOptionId === optionId) {
        // If the deleted tab was active, switch to the tab before it, or the first tab if it was the first one.
        const newActiveIndex = Math.max(0, optionIndexToRemove - 1);
        setActiveOptionId(newOptions[newActiveIndex]?.id || '');
    }
  };
  
  const handleSaveTemplate = () => {
    if (!templateName || !activeOption || activeOption.items.length === 0) {
      alert(t('calculation.error.templateNameAndItemsRequired'));
      return;
    }
    const newTemplate: Omit<Template, 'id'> = { 
        name: templateName, 
        items: activeOption.items.map(({id, ...rest}) => rest),
        userId: currentUser.id
    };
    onTemplateSave(newTemplate);
    setIsTemplateModalOpen(false);
    setTemplateName('');
  };

  const getRecipientEmail = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeSubstitute = workflowSettings.substitutes.find(s => 
        s.startDate <= today && s.endDate >= today
    );
    return activeSubstitute?.email || workflowSettings.primaryCreditApprovalEmail;
  };
  
  const generateQuotePdf = (quoteForPdf: Quote) => {
    const doc = new jsPDF();
    const formatPdfCurrency = (val: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: quoteForPdf.currency || 'EUR' }).format(val);
    const formatPdfNumber = (val: number) => new Intl.NumberFormat(locale).format(val);
    
    const disclaimerText = t('calculation.disclaimer');
    const copyrightText = t('app.copyright', { year: new Date().getFullYear() });

    const pageHeader = () => {
      if (currentUser.role === 'Partner' && currentUser.logoBase64) {
        const img = new Image();
        img.src = currentUser.logoBase64;
        try {
            const aspectRatio = img.width / img.height;
            const pdfWidth = 30;
            const pdfHeight = pdfWidth / aspectRatio;
            doc.addImage(img, 'PNG', 14, 15, pdfWidth, pdfHeight);
        } catch (e) { console.error("Error adding partner logo to PDF:", e); }
      }
      doc.setFontSize(10).text(currentUser.companyName || currentUser.name, 196, 16, { align: 'right' });
      doc.text(currentUser.email, 196, 22, { align: 'right' });
    };

    const pageFooterOptions = {
      didDrawPage: (data: any) => {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
        doc.setFontSize(8);
        doc.setTextColor(150);

        const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - data.settings.margin.left - data.settings.margin.right);
        doc.text(disclaimerLines, data.settings.margin.left, pageHeight - 15);

        doc.text(copyrightText, pageWidth / 2, pageHeight - 5, { align: 'center' });
      }
    };
    
    pageHeader();
    doc.setFontSize(18).text(t('pdf.quoteFor', { customerName: quoteForPdf.customerName || t('common.na') }), 14, 40);
    doc.setFontSize(12).text(t('pdf.project', { projectName: quoteForPdf.projectName || t('common.na') }), 14, 48);

    const formattedStartDate = new Date(quoteForPdf.expectedStartDate).toLocaleDateString(locale);
    doc.setFontSize(10);
    doc.text(`${t('pdf.startDate')}: ${formattedStartDate}`, 14, 54);
    doc.text(`${t('pdf.currency')}: ${quoteForPdf.currency || 'N/A'}`, 14, 59);
    
    let finalY = 70;
    
    const partnerCommission = currentUser.role === UserRole.Partner ? currentUser.commissionPercentage || 0 : 0;
    let allIncludedServices = new Set<AdditionalService | 'Other'>();
    let isPackingServiceUsed = false;
    const serviceSummary: Record<string, { totalCost: number }> = {};
    
    // Aggregate service data from all items across all options for summary
    quoteForPdf.options.forEach(option => {
        option.items.forEach(item => {
            if (item.packingServiceApplied) {
                isPackingServiceUsed = true;
                const serviceName = t('calculation.packingService');
                if (!serviceSummary[serviceName]) serviceSummary[serviceName] = { totalCost: 0 };
                serviceSummary[serviceName].totalCost += (lrfData.packingServiceCost || 0) * item.quantity;
            }
            item.additionalServices.forEach(s => {
                allIncludedServices.add(s.service);
                // FIX: Explicitly typed `serviceName` to `string` to accommodate translated or custom service names.
                let serviceName: string = s.service;
                if (s.service === 'Other' && s.description) {
                    serviceName = s.description;
                } else if (s.service !== 'Other') {
                    const serviceEnumKey = getKeyByValue(AdditionalService, s.service) as keyof typeof AdditionalService;
                    serviceName = t(`enums.AdditionalService.${serviceEnumKey}`, { defaultValue: s.service });
                }
                if (!serviceSummary[serviceName]) serviceSummary[serviceName] = { totalCost: 0 };
                serviceSummary[serviceName].totalCost += s.cost * item.quantity;
            });
        });
    });
    
    quoteForPdf.options.forEach((option) => {
        if (option.items.length === 0) return;

        if (finalY > 250) {
            doc.addPage();
            pageHeader();
            finalY = 40;
        }

        doc.setFontSize(14).setTextColor(40, 40, 40).text(option.name, 14, finalY);
        finalY += 8;
        
        const head = priceViewMode === 'detailed'
            ? [[t('pdf.table.asset'), t('pdf.table.details'), t('pdf.table.term'), t('pdf.table.qty'), t('pdf.table.monthly'), t('pdf.table.total')]]
            : [[t('pdf.table.asset'), t('pdf.table.details'), t('pdf.table.term'), t('pdf.table.qty'), t('pdf.table.monthlyBundled'), t('pdf.table.totalBundled')]];

        let optionTotalMonthly = 0;
        let optionTotalLease = 0;

        const body = option.items.map(item => {
            const leaseRateFactor = getLeaseRateFactor(lrfData.factors, item, lrfData.nonReturnUpliftFactor || 0.008, partnerCommission);
            const monthlyHardwareCostPerUnit = item.hardwareCost * leaseRateFactor;
            
            let totalServicesCostPerUnit = item.additionalServices.reduce((sum, service) => sum + service.cost, 0);
            if (item.packingServiceApplied) {
                totalServicesCostPerUnit += lrfData.packingServiceCost || 0;
            }
            
            // Detailed
            const totalMonthlyCost = monthlyHardwareCostPerUnit * item.quantity;
            const totalLeaseCostPerUnit = (monthlyHardwareCostPerUnit * item.leaseTerm) + totalServicesCostPerUnit;
            const totalLeaseCost = totalLeaseCostPerUnit * item.quantity;
            
            // Bundled
            const monthlyServicesCostPerUnit = item.leaseTerm > 0 ? totalServicesCostPerUnit / item.leaseTerm : 0;
            const bundledMonthlyCostPerUnit = monthlyHardwareCostPerUnit + monthlyServicesCostPerUnit;
            const totalMonthlyBundled = bundledMonthlyCostPerUnit * item.quantity;
            const totalBundledCost = totalMonthlyBundled * item.leaseTerm;
            
            optionTotalMonthly += (priceViewMode === 'detailed' ? totalMonthlyCost : totalMonthlyBundled);
            optionTotalLease += (priceViewMode === 'detailed' ? totalLeaseCost : totalBundledCost);

            const assetDesc = `${item.assetType}${item.customDescription ? `\n(${item.customDescription})` : ''}`;
            let details = `${item.brand}\n${item.condition}, ${item.operatingSystem || 'N/A'}`;
            if ((item.nonReturnPercentage || 0) > 0) details += `\n${t('calculation.table.nonReturn')}`;
            
            const servicesToDisplayInPdf: (ServiceSelection | { service: string, cost: number, description?: string })[] = [...item.additionalServices];
            if (item.packingServiceApplied) {
                servicesToDisplayInPdf.push({
                    service: t('calculation.packingService'),
                    cost: lrfData.packingServiceCost || 0,
                });
            }

            if (servicesToDisplayInPdf.length > 0) {
                const servicesList = servicesToDisplayInPdf.map(s => {
                    let name = s.service;
                    if (s.service !== t('calculation.packingService')) { // Avoid re-translating packing service
                        if (s.service === 'Other' && s.description) {
                            name = s.description;
                        } else {
                            const serviceEnumKey = getKeyByValue(AdditionalService, s.service as AdditionalService) as keyof typeof AdditionalService;
                            name = t(`enums.AdditionalService.${serviceEnumKey}`, { defaultValue: s.service });
                        }
                    }
                    const cost = priceViewMode === 'detailed' ? `: ${formatPdfCurrency(s.cost)}` : '';
                    return `${name}${cost}`;
                }).join('\n');
                details += `\n\n${t('calculation.table.servicesLabel')}:\n${servicesList}`;
            }

            return [
                assetDesc,
                details,
                `${item.leaseTerm} ${t('common.monthsShort')}`,
                formatPdfNumber(item.quantity),
                formatPdfCurrency(priceViewMode === 'detailed' ? totalMonthlyCost : totalMonthlyBundled),
                formatPdfCurrency(priceViewMode === 'detailed' ? totalLeaseCost : totalBundledCost)
            ];
        });

        const subtotalTitle = priceViewMode === 'detailed' ? t('pdf.subtotalFor') : t('pdf.subtotalBundledFor');

        autoTable(doc, {
            startY: finalY,
            head: head,
            body: body,
            foot: [[
                { content: `${subtotalTitle} ${option.name}:`, colSpan: 4, styles: { halign: 'left' } },
                { content: formatPdfCurrency(optionTotalMonthly), styles: { halign: 'right' } },
                { content: formatPdfCurrency(optionTotalLease), styles: { halign: 'right' } }
            ]],
            theme: 'grid',
            headStyles: { fillColor: [8, 5, 147] },
            styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
            footStyles: {
                fontStyle: 'bold',
                fontSize: 9,
                cellPadding: 2,
                fillColor: [255, 255, 255],
                textColor: [40, 40, 40],
            },
            columnStyles: {
                0: { cellWidth: 35 }, 1: { cellWidth: 50 },
                3: { halign: 'right' }, 4: { halign: 'right' }, 5: { halign: 'right' },
            },
            ...pageFooterOptions,
        });

        finalY = (doc as any).lastAutoTable.finalY + 10;
    });

    const serviceSummaryEntries = Object.entries(serviceSummary);
    if (priceViewMode === 'detailed' && serviceSummaryEntries.length > 0) {
        if (finalY > 230) { doc.addPage(); pageHeader(); finalY = 40; }
        doc.setFontSize(14).text(t('pdf.serviceSummary.title'), 14, finalY);
        finalY += 8;
        const summaryBody = serviceSummaryEntries.map(([name, data]) => [name, formatPdfCurrency(data.totalCost)]);
        autoTable(doc, {
            startY: finalY,
            head: [[t('pdf.serviceSummary.service'), t('pdf.serviceSummary.totalCost')]],
            body: summaryBody,
            theme: 'striped',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [230, 230, 230], textColor: 20 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 'auto' }, 1: { halign: 'right' } },
            ...pageFooterOptions
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // FIX: Correct type inference issue by explicitly typing the array and removing 'as any' casts.
    const servicesForDescription: Array<AdditionalService | 'Other' | 'PackingService_KEY'> = Array.from(allIncludedServices);
    if (isPackingServiceUsed) {
        // Use a unique key to avoid conflicts with 'Other'
        servicesForDescription.push('PackingService_KEY');
    }

    if (servicesForDescription.length > 0) {
        if (finalY > 230) { doc.addPage(); pageHeader(); finalY = 40; }
        doc.setFontSize(14).text(t('pdf.serviceDescriptions.title'), 14, finalY);
        finalY += 8;
        const serviceBody = servicesForDescription.map(serviceValue => {
            if (serviceValue === 'Other') {
                return ['Other', t('pdf.serviceDescriptions.Other')];
            }
            if (serviceValue === 'PackingService_KEY') {
                return [t('calculation.packingService'), t('pdf.serviceDescriptions.PackingService')];
            }
            const serviceEnumKey = getKeyByValue(AdditionalService, serviceValue) as keyof typeof AdditionalService;
            if (serviceEnumKey) {
                const desc = t(`pdf.serviceDescriptions.${serviceEnumKey}`);
                const title = t(`enums.AdditionalService.${serviceEnumKey}`);
                return [title, desc];
            }
            return [serviceValue, '']; // Fallback
        });
        autoTable(doc, {
            startY: finalY, body: serviceBody, theme: 'striped', styles: { fontSize: 9 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
             ...pageFooterOptions
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Standard Included Services Section
    if (finalY > 230) { doc.addPage(); pageHeader(); finalY = 40; }
    doc.setFontSize(14).text(t('pdf.standardServices.title'), 14, finalY);
    finalY += 8;
    const standardServicesBody = [
        [t('pdf.standardServices.invoice.title'), t('pdf.standardServices.invoice.desc')],
        [t('pdf.standardServices.tesma.title'), t('pdf.standardServices.tesma.desc')],
        [t('pdf.standardServices.eol.title'), t('pdf.standardServices.eol.desc')],
    ];
    autoTable(doc, {
        startY: finalY, 
        body: standardServicesBody, 
        theme: 'striped', 
        styles: { fontSize: 9 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        ...pageFooterOptions
    });
    finalY = (doc as any).lastAutoTable.finalY + 10;

    doc.save(`${t('pdf.fileName')}-${quoteForPdf.customerName || 'draft'}.pdf`);
  };

  const handleGenerateSummary = async () => {
    if (quote.options.every(o => o.items.length === 0)) {
        alert("Please add items to the quote before generating a summary.");
        return;
    }
    setIsSummaryModalOpen(true);
    setIsGeneratingSummary(true);
    setAiSummary('');

    try {
        const tcoResults = calculateTco(quote, lrfData, tcoSettings, currentUser);
        
        const optionsSummary = quote.options.map(opt => {
            const totalItems = opt.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalValue = opt.items.reduce((sum, item) => sum + item.hardwareCost * item.quantity, 0);
            return `- ${opt.name}: ${totalItems} devices, total hardware value ${totalValue.toFixed(2)} ${quote.currency}.`;
        }).join('\n');

        let prompt = `You are a professional sales assistant for an IT leasing company. Your task is to generate a concise, compelling executive summary for a customer proposal based on the following quote details. The summary should be well-written, professional, and highlight the key value propositions.

        **Customer:** ${quote.customerName || 'Not specified'}
        **Project:** ${quote.projectName || 'Not specified'}
        **Quote Options Summary:**
        ${optionsSummary}
        `;

        if (tcoResults) {
            prompt += `
            **TCO Analysis Results:**
            - By leasing instead of purchasing, the customer can achieve a potential saving of ${tcoResults.absoluteSavings.toFixed(2)} ${quote.currency}.
            - This represents a ${ (tcoResults.savingsPercentage * 100).toFixed(1) }% reduction in the Total Cost of Ownership over the average lease term of ${tcoResults.weightedAvgTermMonths.toFixed(1)} months.
            
            **Instructions:**
            1.  Start with a polite opening addressing the customer.
            2.  Briefly summarize the proposed options.
            3.  Emphasize the financial benefits, especially the TCO savings. Frame it as a strategic advantage (e.g., preserving capital, predictable costs).
            4.  Mention the benefits of the included services (e.g., simplified management, minimized downtime).
            5.  End with a professional closing statement, encouraging the next step (e.g., a follow-up discussion).
            6.  The tone should be confident, professional, and customer-focused.
            7.  Do not include placeholders like "[Your Name]". The summary should be ready to be copied and pasted directly into an email body or a proposal document.
            `;
        } else {
             prompt += `
            **Instructions:**
            1.  Start with a polite opening addressing the customer.
            2.  Briefly summarize the proposed options.
            3.  Mention the benefits of the included services (e.g., simplified management, predictable operational expenses).
            4.  End with a professional closing statement, encouraging the next step (e.g., a follow-up discussion).
            5.  The tone should be confident, professional, and customer-focused.
            6.  Do not include placeholders like "[Your Name]". The summary should be ready to be copied and pasted directly into an email body or a proposal document.
            `;
        }

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        setAiSummary(response.text);

    } catch (error) {
        console.error("Error generating AI summary:", error);
        setAiSummary("Sorry, an error occurred while generating the summary. Please check your API key and try again.");
    } finally {
        setIsGeneratingSummary(false);
    }
  };

  const partnerCommission = isPartner ? currentUser.commissionPercentage || 0 : 0;
  
  return (
    <div className="space-y-6">
        {/* Header and Controls */}
        <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex flex-wrap gap-4 justify-between items-start">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('calculation.title')}</h2>
                    <LrfValidityIndicator lrfData={lrfData} users={profiles} />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" onClick={() => setQuote(createNewQuote())}>{t('calculation.buttons.new')}</Button>
                    <Button variant="secondary" onClick={() => setIsDashboardOpen(true)} leftIcon={<FolderOpenIcon />}>{t('calculation.buttons.dashboard')}</Button>
                    <Button variant="secondary" onClick={() => setIsTemplateModalOpen(true)} leftIcon={<SaveIcon />} disabled={!activeOption || activeOption.items.length === 0}>{t('calculation.buttons.saveTemplate')}</Button>
                    <Button variant="secondary" onClick={() => generateQuotePdf(quote)} leftIcon={<DocumentDownloadIcon />}>{t('calculation.buttons.generatePdf')}</Button>
                    <Button onClick={handleGenerateSummary} variant="secondary" leftIcon={<SparklesIcon />}>{t('aiSummary.button')}</Button>
                    {isPartner && (
                        <div title={!quote.customerName || quote.options.every(o => o.items.length === 0) ? t('creditRequestPartnerDisabledTooltip') : ''}>
                             <Button 
                                onClick={() => setIsCreditModalOpen(true)} 
                                disabled={!quote.customerName || quote.options.every(o => o.items.length === 0)}
                                leftIcon={<CheckCircleIcon />}
                            >
                                {t('calculation.buttons.requestCreditApproval')}
                            </Button>
                        </div>
                    )}
                     {!isPartner && (
                        <div title={t('creditRequestAdminTooltip')}>
                            <Button disabled leftIcon={<CheckCircleIcon />}>{t('calculation.buttons.requestCreditApproval')}</Button>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label={t('calculation.customerName')} value={quote.customerName} onChange={e => handleQuoteFieldChange('customerName', e.target.value)} placeholder={t('calculation.customerNamePlaceholder')} />
                <Input label={t('calculation.projectName')} value={quote.projectName} onChange={e => handleQuoteFieldChange('projectName', e.target.value)} placeholder={t('calculation.projectNamePlaceholder')} />
                <Input label={t('calculation.expectedStartDate')} type="date" value={quote.expectedStartDate.split('T')[0]} onChange={e => handleQuoteFieldChange('expectedStartDate', new Date(e.target.value).toISOString())} />
            </div>
        </div>

      {/* Options Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {quote.options.map(option => (
          <div key={option.id} className="relative">
            <button
              onClick={() => setActiveOptionId(option.id)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-md transition-colors ${activeOptionId === option.id ? 'bg-white text-brand-600 border-x border-t border-slate-200' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              {option.name}
            </button>
            {quote.options.length > 1 && (
              <button onClick={() => removeOption(option.id)} className="absolute -top-2 -right-2 text-red-400 hover:text-red-600 bg-white rounded-full w-5 h-5 flex items-center justify-center border text-xs">&times;</button>
            )}
          </div>
        ))}
        <Button size="sm" variant="secondary" onClick={addOption} leftIcon={<PlusIcon />}>{t('calculation.buttons.addOption')}</Button>
      </div>
      
      {/* Active Option Content */}
      <div className="bg-white p-6 rounded-xl shadow-md">
         {activeOption && (
            <div>
              <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                  <SegmentedControl
                      label={t('calculation.priceView.label')}
                      options={[
                          { label: t('calculation.priceView.detailed'), value: 'detailed' },
                          { label: t('calculation.priceView.bundled'), value: 'bundled' },
                      ]}
                      value={priceViewMode}
                      onChange={(val) => setPriceViewMode(val as PriceViewMode)}
                  />
                  <div className="flex items-center gap-2">
                    <Button onClick={() => setIsWizardOpen(true)} leftIcon={<PlusIcon />}>{t('calculation.buttons.addItemTo', {optionName: activeOption.name})}</Button>
                  </div>
              </div>

              {activeOption.items.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">{t('calculation.table.asset')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-1/4">{t('calculation.table.details')}</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('calculation.table.term')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('calculation.table.qty')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{priceViewMode === 'detailed' ? t('calculation.table.monthlyCost') : t('calculation.table.monthlyBundled')}</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{priceViewMode === 'detailed' ? t('calculation.table.totalCost') : t('calculation.table.totalBundled')}</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{t('calculation.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {activeOption.items.map(item => (
                                <CalculationRow 
                                    key={item.id} 
                                    item={item}
                                    leaseRateFactor={getLeaseRateFactor(lrfData.factors, item, lrfData.nonReturnUpliftFactor || 0.008, partnerCommission)}
                                    onRemove={removeItem}
                                    onEdit={id => setItemToEdit(activeOption.items.find(i => i.id === id) || null)}
                                    onDuplicate={duplicateItem}
                                    priceViewMode={priceViewMode}
                                    currency={quote.currency || 'EUR'}
                                    packingServiceCost={lrfData.packingServiceCost || 0}
                                />
                            ))}
                        </tbody>
                    </table>
                  </div>
                  <CalculationSummary 
                      {...activeOption.items.reduce((acc, item) => {
                          const factor = getLeaseRateFactor(lrfData.factors, item, lrfData.nonReturnUpliftFactor || 0.008, partnerCommission);
                          const monthlyHardwareCost = item.hardwareCost * factor;
                          const totalMonthly = monthlyHardwareCost * item.quantity;
                          
                          let totalServices = item.additionalServices.reduce((s, serv) => s + serv.cost, 0) * item.quantity;
                          if (item.packingServiceApplied) {
                              totalServices += (lrfData.packingServiceCost || 0) * item.quantity;
                          }

                          const totalLease = (monthlyHardwareCost * item.leaseTerm) * item.quantity + totalServices;

                          const monthlyServices = item.leaseTerm > 0 ? totalServices / item.leaseTerm : 0;
                          const bundledMonthly = totalMonthly + monthlyServices;

                          acc.totalHardwareCost += item.hardwareCost * item.quantity;
                          acc.totalServicesCost += totalServices;
                          acc.totalMonthlyCost += totalMonthly;
                          acc.totalLeaseCost += totalLease;
                          acc.totalMonthlyBundled += bundledMonthly;
                          acc.totalLeaseBundled += bundledMonthly * item.leaseTerm;

                          return acc;
                      }, { totalHardwareCost: 0, totalServicesCost: 0, totalMonthlyCost: 0, totalLeaseCost: 0, totalMonthlyBundled: 0, totalLeaseBundled: 0 })}
                      priceViewMode={priceViewMode}
                      currency={quote.currency || 'EUR'}
                  />
                </>
              ) : (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed rounded-lg">
                    <p className="text-lg font-semibold">{t('calculation.empty.title')}</p>
                    <p className="text-sm">{t('calculation.empty.description')}</p>
                </div>
              )}
            </div>
         )}
      </div>

        {/* Disclaimer */}
        <p className="text-xs text-slate-500 text-center mt-4">(*) {t('calculation.disclaimer')}</p>

        {/* Modals */}
        <AiSummaryModal 
            isOpen={isSummaryModalOpen}
            onClose={() => setIsSummaryModalOpen(false)}
            summaryText={aiSummary}
            isLoading={isGeneratingSummary}
        />
        <CalculationWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} onAddItem={addItem} currency={quote.currency || 'EUR'} />
        {itemToEdit && (
            <EditItemModal 
                isOpen={!!itemToEdit} 
                onClose={() => setItemToEdit(null)} 
                item={itemToEdit}
                onUpdateItem={updateItem}
                currency={quote.currency || 'EUR'}
            />
        )}
        <QuoteDashboardModal
            isOpen={isDashboardOpen}
            onClose={() => setIsDashboardOpen(false)}
            savedQuotes={savedQuotes}
            onQuoteDelete={onQuoteDelete}
            setQuote={setQuote}
            createNewQuote={createNewQuote}
            templates={templates}
            onTemplateDelete={onTemplateDelete}
            quote={quote}
        />
        <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title={t('calculation.templateModal.title')}>
            <div className="space-y-4">
                <Input label={t('calculation.templateModal.nameLabel')} value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder={t('calculation.templateModal.namePlaceholder')} />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
                <Button variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>{t('common.cancel')}</Button>
                <Button onClick={handleSaveTemplate}>{t('calculation.templateModal.saveButton')}</Button>
            </div>
        </Modal>
        {isPartner && (
          <CreditRequestModal
            isOpen={isCreditModalOpen}
            onClose={() => setIsCreditModalOpen(false)}
            quote={quote}
            setQuote={setQuote}
            onSubmit={(quoteForLog, country) => {
              const quoteWithStatus = {
                ...quoteForLog,
                status: QuoteStatus.CreditPending
              };
              setQuote(quoteWithStatus);
              onQuoteSave(quoteWithStatus);
              addActivityLog(ActivityType.CreditRequestSent, `Request sent for ${country} to ${getRecipientEmail()}`, quoteWithStatus);
            }}
            workflowSettings={workflowSettings}
            currentUser={currentUser}
          />
        )}
    </div>
  );
};
// FIX: Add default export for CalculationSheet component
export default CalculationSheet;