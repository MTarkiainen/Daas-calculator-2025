import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GoogleGenAI, Type } from '@google/genai';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Quote, WorkflowSettings, Profile, CalculationItem, CountryCustomerDetails, UserRole, AdditionalService, QuoteStatus } from '../../types';
import { COUNTRIES, COUNTRY_CURRENCY_MAP } from '../../constants';
import { Select } from '../ui/Select';
import { useLanguage } from '../../i18n/LanguageContext';
import SparklesIcon from '../ui/icons/SparklesIcon';
import { getLeaseRateFactor } from '../../utils/calculationUtils';
import ChevronLeftIcon from '../ui/icons/ChevronLeftIcon';

interface CreditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  setQuote: React.Dispatch<React.SetStateAction<Quote>>;
  onSubmit: (updatedQuote: Quote, country: string) => void;
  workflowSettings: WorkflowSettings;
  currentUser: Profile;
}

const CreditRequestModal: React.FC<CreditRequestModalProps> = ({ 
    isOpen, onClose, quote, setQuote, onSubmit, workflowSettings, currentUser,
}) => {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<'hub' | 'form'>('hub');
  const [activeCountry, setActiveCountry] = useState<string | null>(null);

  // State for the form view
  const [countryDetails, setCountryDetails] = useState<Partial<CountryCustomerDetails>>({});
  const [aiText, setAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { countriesInQuote, itemsByCountry, itemsWithoutCountry } = useMemo(() => {
    const allItems = quote.options.flatMap(o => o.items);
    const itemsByCountry: Record<string, CalculationItem[]> = {};
    let itemsWithoutCountry = 0;

    for (const item of allItems) {
        if (item.country) {
            if (!itemsByCountry[item.country]) {
                itemsByCountry[item.country] = [];
            }
            itemsByCountry[item.country].push(item);
        } else {
            itemsWithoutCountry++;
        }
    }
    return { countriesInQuote: Object.keys(itemsByCountry).sort(), itemsByCountry, itemsWithoutCountry };
  }, [quote]);

  useEffect(() => {
    if (!isOpen) {
        setTimeout(() => { // Delay reset to allow for closing animation
            setView('hub');
            setActiveCountry(null);
        }, 300);
    }
  }, [isOpen]);

  const handleEnterDetails = (country: string) => {
    setActiveCountry(country);
    setCountryDetails(quote.countrySpecificDetails?.[country] || { customerCountry: country });
    setAiText('');
    setErrorMessage(null);
    setView('form');
  };
  
  const handleFormChange = (field: keyof CountryCustomerDetails, value: string) => {
    if (errorMessage) setErrorMessage(null);
    setCountryDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleAiFill = async () => {
    if (!aiText.trim()) return;
    setIsAiLoading(true);
    try {
        const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            alert("AI features are disabled. Please configure your Gemini API key in the .env file.");
            setIsAiLoading(false);
            return;
        }
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Extract the following details from the text below. If a value isn't found, leave it as an empty string. Text: "${aiText}"`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        companyName: { type: Type.STRING },
                        address: { type: Type.STRING },
                        city: { type: Type.STRING },
                        postalCode: { type: Type.STRING },
                        vatId: { type: Type.STRING },
                        contactName: { type: Type.STRING },
                        contactEmail: { type: Type.STRING },
                        contactPhone: { type: Type.STRING },
                    }
                }
            }
        });
        
        const result = JSON.parse(response.text);
        
        setCountryDetails(prev => ({
            ...prev,
            customerName: result.companyName || prev.customerName,
            customerAddress: result.address || prev.customerAddress,
            customerCity: result.city || prev.customerCity,
            customerPostalCode: result.postalCode || prev.customerPostalCode,
            customerVatId: result.vatId || prev.customerVatId,
            customerContactName: result.contactName || prev.customerContactName,
            customerContactEmail: result.contactEmail || prev.customerContactEmail,
            customerContactPhone: result.contactPhone || prev.customerContactPhone,
        }));
    } catch (error) {
        console.error("Error with Gemini API:", error);
        alert("Could not extract details automatically. Please fill the form manually.");
    } finally {
        setIsAiLoading(false);
    }
  };

  const validateForm = () => {
    const requiredFields = ['customerName', 'customerAddress', 'customerCity', 'customerPostalCode', 'customerVatId', 'customerContactName', 'customerContactEmail', 'customerContactPhone'] as const;
    const missingFields = requiredFields.filter(field => !countryDetails[field]?.trim());

    if (missingFields.length > 0) {
        const fieldLabels: Record<typeof requiredFields[number], string> = {
            customerName: t('creditModal.companyName'), customerAddress: t('creditModal.address'), customerCity: t('creditModal.city'), customerPostalCode: t('creditModal.postalCode'), customerVatId: t('creditModal.vatId'), customerContactName: t('creditModal.contactName'), customerContactEmail: t('creditModal.contactEmail'), customerContactPhone: t('creditModal.contactPhone'),
        };
        setErrorMessage(t('creditModal.error.missingFields', { fields: missingFields.map(f => fieldLabels[f]).join(', ') }));
        return false;
    }
    return true;
  };
  
  const handleSaveCountryDetails = () => {
    if (!validateForm()) return;

    setQuote(prevQuote => ({
      ...prevQuote,
      countrySpecificDetails: {
        ...prevQuote.countrySpecificDetails,
        [activeCountry!]: countryDetails,
      }
    }));
    setView('hub');
  };

  const getRecipientEmail = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeSubstitute = workflowSettings.substitutes.find(s => s.startDate <= today && s.endDate >= today);
    return activeSubstitute?.email || workflowSettings.primaryCreditApprovalEmail;
  };
  
  const generateConsolidatedPdf = () => {
    const doc = new jsPDF();
    const formatCurrency = (val: number) => new Intl.NumberFormat(locale, { style: 'currency', currency: quote.currency || 'EUR' }).format(val);

    doc.setFontSize(18).text(`Multi-Country Credit Request for ${quote.customerName}`, 14, 20);
    doc.setFontSize(12).text(`Project: ${quote.projectName}`, 14, 28);
    let finalY = 40;

    countriesInQuote.forEach(country => {
        const countryData = quote.countrySpecificDetails?.[country];
        if (!countryData) return;
        
        const countryItems = itemsByCountry[country];

        if (finalY > 220) { doc.addPage(); finalY = 20; }
        
        doc.setFontSize(14).text(`Section: ${country}`, 14, finalY);
        finalY += 8;

        autoTable(doc, {
            startY: finalY,
            head: [[{content: t('pdf.customerDetails.title'), colSpan: 2, styles: {fillColor: [230, 230, 230], textColor: 20}}]],
            body: [
                [t('creditModal.companyName'), countryData.customerName],
                [t('creditModal.address'), `${countryData.customerAddress}, ${countryData.customerPostalCode} ${countryData.customerCity}`],
                [t('creditModal.vatId'), countryData.customerVatId],
                [t('creditModal.contactName'), countryData.customerContactName],
                [t('creditModal.contactEmail'), countryData.customerContactEmail],
                [t('creditModal.contactPhone'), countryData.customerContactPhone],
            ],
            theme: 'grid'
        });
        finalY = (doc as any).lastAutoTable.finalY + 5;
        
        autoTable(doc, {
            startY: finalY,
            head: [[t('pdf.table.asset'), t('pdf.table.qty'), t('pdf.table.term'), t('pdf.table.total')]],
            body: countryItems.map(item => [
                `${item.assetType} - ${item.brand}`,
                item.quantity,
                item.leaseTerm,
                formatCurrency(item.hardwareCost * item.quantity)
            ]),
            theme: 'striped',
            headStyles: { fillColor: [8, 5, 147] }
        });
        finalY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`Consolidated-Credit-Request-${quote.customerName}.pdf`);
  };
  
  const handlePrepareConsolidatedRequest = () => {
    generateConsolidatedPdf();
    
    const recipient = getRecipientEmail();
    const subject = `Consolidated Credit Request for ${quote.customerName} from ${currentUser.companyName || currentUser.name}`;
    const body = `Dear Credit Team,\n\nPlease find the consolidated multi-country quote attached for your review and approval.\n\nProject: ${quote.projectName}\nCustomer: ${quote.customerName}\n\nThis request covers assets for the following countries: ${countriesInQuote.join(', ')}.\n\nThank you,\n${currentUser.name}`;
    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    const updatedQuote = {
        ...quote,
        status: QuoteStatus.CreditPending
    };
    onSubmit(updatedQuote, countriesInQuote.join(', '));
    onClose();
  };
  
  const allDetailsComplete = countriesInQuote.length > 0 && countriesInQuote.every(c => quote.countrySpecificDetails?.[c]?.customerName);

  const renderHub = () => (
    <div className="space-y-4">
        <p className="text-sm text-slate-600">{t('creditModal.hub.description_consolidated')}</p>
        {itemsWithoutCountry > 0 && (
            <div className="p-3 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800">
                <p className="font-semibold">{t('creditModal.hub.noCountryWarning')}</p>
            </div>
        )}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
            {countriesInQuote.map(country => {
                const items = itemsByCountry[country];
                const totalValue = items.reduce((sum, item) => sum + (item.hardwareCost * item.quantity), 0);
                const hasDetails = !!quote.countrySpecificDetails?.[country]?.customerName;
                return (
                    <div key={country} className="p-4 border rounded-lg flex justify-between items-center">
                        <div>
                            <h4 className="font-bold text-lg text-slate-800">{country}</h4>
                            <p className="text-sm text-slate-500">{t('creditModal.hub.itemSummary', { count: items.length, value: totalValue.toLocaleString(locale, { style: 'currency', currency: quote.currency || 'EUR' }) })}</p>
                            <p className="text-xs font-medium mt-1">
                                {t('creditModal.hub.status')}: 
                                <span className={hasDetails ? "text-green-600" : "text-amber-600"}>
                                    {hasDetails ? ` ${t('creditModal.hub.statusComplete')}` : ` ${t('creditModal.hub.statusNeeded')}`}
                                </span>
                            </p>
                        </div>
                        <div className="flex items-center space-x-2">
                             <Button variant="secondary" onClick={() => handleEnterDetails(country)}>
                                {hasDetails ? t('creditModal.hub.editDetailsButton') : t('creditModal.hub.enterDetailsButton')}
                            </Button>
                        </div>
                    </div>
                );
            })}
        </div>
        <div className="pt-4 border-t flex flex-col items-center">
            <div title={!allDetailsComplete ? t('creditModal.hub.consolidatedButtonTooltip') : ''}>
                <Button 
                    onClick={handlePrepareConsolidatedRequest}
                    disabled={!allDetailsComplete}
                    size="lg"
                >
                    {t('creditModal.hub.consolidatedButton')}
                </Button>
            </div>
        </div>
    </div>
  );

  const renderForm = () => (
    <form onSubmit={(e) => { e.preventDefault(); handleSaveCountryDetails(); }} className="space-y-6">
        <div className="p-4 border rounded-lg bg-slate-50">
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('creditModal.ai.label')}</label>
            <textarea
                rows={3}
                className="block w-full text-sm border-slate-300 rounded-md shadow-sm"
                placeholder={t('creditModal.ai.placeholder')}
                value={aiText}
                onChange={e => setAiText(e.target.value)}
            />
            <Button type="button" onClick={handleAiFill} disabled={isAiLoading} leftIcon={<SparklesIcon />} size="sm" className="mt-2">
                {isAiLoading ? t('common.loading') : t('creditModal.ai.button')}
            </Button>
        </div>
        <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
           <Input label={t('creditModal.companyName')} value={countryDetails.customerName || ''} onChange={e => handleFormChange('customerName', e.target.value)} />
           <Input label={t('creditModal.address')} value={countryDetails.customerAddress || ''} onChange={e => handleFormChange('customerAddress', e.target.value)} />
           <div className="grid grid-cols-2 gap-4">
              <Input label={t('creditModal.city')} value={countryDetails.customerCity || ''} onChange={e => handleFormChange('customerCity', e.target.value)} />
              <Input label={t('creditModal.postalCode')} value={countryDetails.customerPostalCode || ''} onChange={e => handleFormChange('customerPostalCode', e.target.value)} />
           </div>
           <Input label={t('creditModal.vatId')} value={countryDetails.customerVatId || ''} onChange={e => handleFormChange('customerVatId', e.target.value)} />
           <Select label={t('creditModal.creditType')} value={countryDetails.creditType || 'New'} onChange={e => handleFormChange('creditType', e.target.value)} >
              <option value="New">{t('creditModal.creditTypeNew')}</option>
              <option value="Existing">{t('creditModal.creditTypeExisting')}</option>
           </Select>
           <h4 className="text-md font-semibold border-t pt-4">{t('creditModal.contactPerson')}</h4>
           <Input label={t('creditModal.contactName')} value={countryDetails.customerContactName || ''} onChange={e => handleFormChange('customerContactName', e.target.value)} />
           <Input label={t('creditModal.contactEmail')} type="email" value={countryDetails.customerContactEmail || ''} onChange={e => handleFormChange('customerContactEmail', e.target.value)} />
           <Input label={t('creditModal.contactPhone')} value={countryDetails.customerContactPhone || ''} onChange={e => handleFormChange('customerContactPhone', e.target.value)} />
        </div>
        {errorMessage && <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm"><p className="font-bold">{t('creditModal.error.title')}</p><p>{errorMessage}</p></div>}
        <div className="mt-6 flex justify-between">
            <Button type="button" variant="secondary" onClick={() => setView('hub')} leftIcon={<ChevronLeftIcon />}>{t('common.back')}</Button>
            <Button type="submit">{t('common.save')}</Button>
        </div>
    </form>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={view === 'hub' ? t('creditModal.multiCountryTitle') : t('creditModal.form.title', { country: activeCountry || ''})}
    >
      {view === 'hub' ? renderHub() : renderForm()}
    </Modal>
  );
};

export default CreditRequestModal;