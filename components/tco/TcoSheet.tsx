import React, { useMemo, useState } from 'react';
import { Quote, TcoSettings, LeaseRateFactorsData, Profile, UserRole, TcoSuggestion, AssetType } from '../../types';
import { INDUSTRIES_WACC } from '../../constants';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import TcoBarChart from './TcoBarChart';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../ui/Button';
import SparklesIcon from '../ui/icons/SparklesIcon';
import { GoogleGenAI, Type } from '@google/genai';
import TcoTuningModal from './TcoTuningModal';
import { calculateTco } from '../../utils/calculationUtils';

interface TcoSheetProps {
  quote: Quote;
  lrfData: LeaseRateFactorsData;
  tcoSettings: TcoSettings;
  setTcoSettings: React.Dispatch<React.SetStateAction<TcoSettings>>;
  currentUser: Profile;
}

const TcoSheet: React.FC<TcoSheetProps> = ({ quote, lrfData, tcoSettings, setTcoSettings, currentUser }) => {
    const { t, locale } = useLanguage();
    const [isTuning, setIsTuning] = useState(false);
    const [isTuningModalOpen, setIsTuningModalOpen] = useState(false);
    const [tuningSuggestions, setTuningSuggestions] = useState<TcoSuggestion[]>([]);
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat(locale, { style: 'currency', currency: quote.currency || 'EUR' }).format(value);
    };

    const formatPercent = (value: number) => {
        return new Intl.NumberFormat(locale, { style: 'percent', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value / 100);
    };

    const handleSettingsChange = (field: keyof TcoSettings, value: string | number | boolean) => {
        const numericFields: (keyof TcoSettings)[] = [
            'customWacc', 'deploymentCostPerDevice', 'itSupportHoursPerDeviceYear', 'itStaffHourlyRate',
            'failuresPerDeviceYear', 'downtimeHoursPerFailure', 'employeeCostPerHour', 'eoldCostPerDevice', 'residualValuePercentage'
        ];
        if (numericFields.includes(field as any)) {
            setTcoSettings(prev => ({ ...prev, [field]: parseFloat(value as string) || 0 }));
        } else {
            setTcoSettings(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleTuneAssumptions = async () => {
        setIsTuning(true);
        try {
            const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;
            if (!apiKey) {
                alert("AI features are disabled. Please configure your Gemini API key in the .env file.");
                setIsTuning(false);
                return;
            }

            const allItems = quote.options.flatMap(o => o.items);
            if (allItems.length === 0) {
                alert("Please add items to the quote before tuning assumptions.");
                setIsTuning(false);
                return;
            }

            const deviceCounts = allItems.reduce((acc, item) => {
                acc[item.assetType] = (acc[item.assetType] || 0) + item.quantity;
                return acc;
            }, {} as Record<AssetType, number>);

            const quoteSummary = `Total devices: ${allItems.reduce((sum, i) => sum + i.quantity, 0)}. Device mix: ${Object.entries(deviceCounts).map(([type, count]) => `${count} ${type}(s)`).join(', ')}.`;
            const industry = tcoSettings.selectedIndustry;
            
            const prompt = `You are a senior financial analyst specializing in IT hardware lifecycle costs. Your task is to refine Total Cost of Ownership (TCO) assumptions for a customer quote.
            
            Based on the following quote summary and current TCO settings, provide suggestions for more realistic values. The customer is in the '${industry}' industry.
            
            Quote Summary: ${quoteSummary}
            
            Current TCO Assumptions: ${JSON.stringify(tcoSettings, null, 2)}
            
            For each parameter you suggest changing, provide a brief, data-driven reasoning. Focus on how the industry and device mix might influence costs. If a current value seems reasonable, you don't need to suggest a change for it. Return your suggestions in the specified JSON format.`;

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            suggestions: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        parameter: { type: Type.STRING, description: "The key of the TCO setting to change. Must be one of: 'deploymentCostPerDevice', 'itSupportHoursPerDeviceYear', 'failuresPerDeviceYear', 'downtimeHoursPerFailure', 'eoldCostPerDevice', 'residualValuePercentage'." },
                                        suggestedValue: { type: Type.NUMBER, description: "The new suggested numeric value for the parameter." },
                                        reasoning: { type: Type.STRING, description: "A brief justification for the suggested change, citing industry and device mix." }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            const result = JSON.parse(response.text);
            setTuningSuggestions(result.suggestions || []);
            setIsTuningModalOpen(true);

        } catch (error) {
            console.error("Error tuning TCO assumptions:", error);
            alert("Failed to get AI suggestions. Please check your API key and try again.");
        } finally {
            setIsTuning(false);
        }
    };

    const handleApplySuggestions = (suggestionsToApply: TcoSuggestion[]) => {
        const newSettings = { ...tcoSettings };
        suggestionsToApply.forEach(suggestion => {
            if (suggestion.parameter in newSettings) {
                (newSettings as any)[suggestion.parameter] = suggestion.suggestedValue;
            }
        });
        setTcoSettings(newSettings);
        setIsTuningModalOpen(false);
    };


    const calculations = useMemo(() => {
        return calculateTco(quote, lrfData, tcoSettings, currentUser);
    }, [quote, lrfData, tcoSettings, currentUser]);

    if (!calculations) {
        return (
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <h2 className="text-xl font-semibold mb-4">{t('tco.title')}</h2>
                 <div className="text-center py-12 text-slate-500 border rounded-lg">
                    <p className="text-lg">{t('tco.empty.title')}</p>
                    <p>{t('tco.empty.description')}</p>
                </div>
            </div>
        )
    }

    const { 
      totalPurchasePrice, totalLeaseCost, totalTcoForPurchase, costOfCapital, totalDeploymentCost,
      totalSupportCost, totalDowntimeCost, totalEoldCost, totalResidualValue,
      absoluteSavings, savingsPercentage, weightedAvgTermMonths
    } = calculations;

    return (
        <div className="space-y-6">
            <TcoTuningModal
                isOpen={isTuningModalOpen}
                onClose={() => setIsTuningModalOpen(false)}
                suggestions={tuningSuggestions}
                currentSettings={tcoSettings}
                onApply={handleApplySuggestions}
            />
            <div className="bg-white p-6 rounded-xl shadow-md text-center">
                <h2 className="text-2xl font-bold text-slate-800">{t('tco.title')}</h2>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                 <TcoBarChart
                    leaseCost={totalLeaseCost}
                    purchaseCost={totalTcoForPurchase}
                    currency={quote.currency || 'EUR'}
                />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
                <h3 className="text-lg font-semibold text-center mb-2">{t('tco.wacc.title')}</h3>
                 <Select label={t('tco.wacc.industry')} value={tcoSettings.selectedIndustry} onChange={e => handleSettingsChange('selectedIndustry', e.target.value)} disabled={tcoSettings.useCustomWacc}>
                    {Object.keys(INDUSTRIES_WACC).map(industry => (
                        <option key={industry} value={industry}>
                            {t(`tco.industries.${industry.replace(/ & /g, '').replace(/ /g, '')}`, {
                              defaultValue: industry,
                            })}
                        </option>
                    ))}
                </Select>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tco.wacc.industryAverage')}</label>
                    <div className="p-2 bg-slate-100 border rounded-xl text-right">{formatPercent(INDUSTRIES_WACC[tcoSettings.selectedIndustry])}</div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('tco.wacc.applyIndividual')}</label>
                    <div className="flex items-center space-x-4 bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => handleSettingsChange('useCustomWacc', false)} className={`w-1/2 py-1 rounded-lg text-sm ${!tcoSettings.useCustomWacc ? 'bg-white shadow' : ''}`}>{t('common.no')}</button>
                        <button onClick={() => handleSettingsChange('useCustomWacc', true)} className={`w-1/2 py-1 rounded-lg text-sm ${tcoSettings.useCustomWacc ? 'bg-white shadow' : ''}`}>{t('common.yes')}</button>
                    </div>
                </div>
                {tcoSettings.useCustomWacc && (
                    <Input label={t('tco.wacc.individualWacc')} type="number" step="0.01" value={tcoSettings.customWacc} onChange={e => handleSettingsChange('customWacc', e.target.value)} />
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex justify-between items-center border-b pb-2 mb-4">
                    <h3 className="text-xl font-semibold">{t('tco.assumptions.title')}</h3>
                    <Button onClick={handleTuneAssumptions} disabled={isTuning} leftIcon={<SparklesIcon />} variant="secondary">
                        {isTuning ? t('common.loading') : t('tco.tuning.button')}
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700">{t('tco.assumptions.operationalCosts')}</h4>
                        <Input label={t('tco.assumptions.deploymentCost')} type="number" value={tcoSettings.deploymentCostPerDevice} onChange={e => handleSettingsChange('deploymentCostPerDevice', e.target.value)} />
                        <Input label={t('tco.assumptions.supportHours')} type="number" value={tcoSettings.itSupportHoursPerDeviceYear} onChange={e => handleSettingsChange('itSupportHoursPerDeviceYear', e.target.value)} />
                        <Input label={t('tco.assumptions.staffRate')} type="number" value={tcoSettings.itStaffHourlyRate} onChange={e => handleSettingsChange('itStaffHourlyRate', e.target.value)} />
                        <Input label={t('tco.assumptions.eoldCost')} type="number" value={tcoSettings.eoldCostPerDevice} onChange={e => handleSettingsChange('eoldCostPerDevice', e.target.value)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700">{t('tco.assumptions.downtimeProductivity')}</h4>
                        <Input label={t('tco.assumptions.failures')} type="number" step="0.01" value={tcoSettings.failuresPerDeviceYear} onChange={e => handleSettingsChange('failuresPerDeviceYear', e.target.value)} />
                        <Input label={t('tco.assumptions.downtimeHours')} type="number" value={tcoSettings.downtimeHoursPerFailure} onChange={e => handleSettingsChange('downtimeHoursPerFailure', e.target.value)} />
                        <Input label={t('tco.assumptions.employeeCost')} type="number" value={tcoSettings.employeeCostPerHour} onChange={e => handleSettingsChange('employeeCostPerHour', e.target.value)} />
                    </div>
                     <div className="space-y-4">
                        <h4 className="font-semibold text-slate-700">{t('tco.assumptions.assetValue')}</h4>
                        <Input label={t('tco.assumptions.residualValue')} type="number" value={tcoSettings.residualValuePercentage} onChange={e => handleSettingsChange('residualValuePercentage', e.target.value)} />
                    </div>
                </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-xl font-semibold mb-2">{t('tco.breakdown.title')}</h3>
                <div className="text-sm text-slate-600 mb-4">
                    <strong>{t('tco.breakdown.averageLeaseTerm')}: </strong>
                    {weightedAvgTermMonths.toFixed(1)} {t('common.months')}
                </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                            <th className="py-2 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tco.table.category')}</th>
                            <th className="py-2 px-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tco.table.purchase')}</th>
                            <th className="py-2 px-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('tco.table.lease')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.hardwareCost')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(totalPurchasePrice)}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-500 italic">{t('common.na')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.capitalCost')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(costOfCapital)}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-500 italic">{t('common.na')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.deployment')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(totalDeploymentCost)}</td>
                                <td className="py-2 px-4 text-right font-medium text-chg-sage">{t('tco.included')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.support')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(totalSupportCost)}</td>
                                <td className="py-2 px-4 text-right font-medium text-chg-sage">{t('tco.included')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.downtime')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(totalDowntimeCost)}</td>
                                <td className="py-2 px-4 text-right font-medium text-chg-sage">{t('tco.mitigated')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.eold')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(totalEoldCost)}</td>
                                <td className="py-2 px-4 text-right font-medium text-chg-sage">{t('tco.included')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600 text-red-600">{t('tco.table.residualValue')}</td>
                                <td className="py-2 px-4 text-right font-medium text-red-600">({formatCurrency(totalResidualValue)})</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-500 italic">{t('common.na')}</td>
                            </tr>
                            <tr>
                                <td className="py-2 px-4 text-slate-600">{t('tco.table.leasePayments')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-500 italic">{t('common.na')}</td>
                                <td className="py-2 px-4 text-right font-medium text-slate-800">{formatCurrency(totalLeaseCost)}</td>
                            </tr>
                        </tbody>
                        <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                            <tr className="font-bold text-slate-900 text-base">
                                <td className="py-3 px-4">{t('tco.table.totalTco')}</td>
                                <td className="py-3 px-4 text-right text-slate-700">{formatCurrency(totalTcoForPurchase)}</td>
                                <td className="py-3 px-4 text-right text-chg-active-blue">{formatCurrency(totalLeaseCost)}</td>
                            </tr>
                            <tr className="bg-chg-sage/20 font-bold">
                                <td className="py-3 px-4 text-chg-sage">{t('tco.savingsWithLease')}</td>
                                <td colSpan={2} className="py-3 px-4 text-right text-chg-sage">{formatCurrency(absoluteSavings)} ({formatPercent(savingsPercentage * 100)})</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <div className="text-center mt-4 bg-white p-4 rounded-xl shadow-md">
                <p className="text-xs text-slate-500">
                    <strong>{t('tco.glossary.title')}:</strong> {t('tco.glossary.wacc')}
                </p>
            </div>
        </div>
    );
};

export default TcoSheet;