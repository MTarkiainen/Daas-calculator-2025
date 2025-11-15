
import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

const TermsAndConditions: React.FC = () => {
    const { t, locale } = useLanguage();
    const today = new Date().toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="text-sm text-gray-700 space-y-4">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800">
                <p className="font-bold">{t('legal.terms.legalDisclaimer')}</p>
            </div>

            <p className="text-xs text-gray-500">{t('legal.terms.lastUpdated', { date: today })}</p>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.acceptance.title')}</h3>
            <p>{t('legal.terms.acceptance.p1')}</p>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.useOfService.title')}</h3>
            <p>{t('legal.terms.useOfService.p1')}</p>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.data.title')}</h3>
            <p>{t('legal.terms.data.p1')}</p>
            
            <h4 className="font-semibold text-gray-800 pt-2">{t('legal.terms.data.listTitle')}</h4>
            <ul className="list-disc list-outside space-y-1 pl-5">
                <li>{t('legal.terms.data.li1')}</li>
                <li>{t('legal.terms.data.li2')}</li>
                <li>{t('legal.terms.data.li3')}</li>
            </ul>

            <h4 className="font-semibold text-gray-800 pt-2">{t('legal.terms.data.purposeTitle')}</h4>
             <ul className="list-disc list-outside space-y-1 pl-5">
                <li>{t('legal.terms.data.purposeLi1')}</li>
                <li>{t('legal.terms.data.purposeLi2')}</li>
                <li>{t('legal.terms.data.purposeLi3')}</li>
                <li>{t('legal.terms.data.purposeLi4')}</li>
            </ul>
            
            <h4 className="font-semibold text-gray-800 pt-2">{t('legal.terms.data.storageTitle')}</h4>
             <ul className="list-disc list-outside space-y-1 pl-5">
                <li>{t('legal.terms.data.storageLi1')}</li>
                <li>{t('legal.terms.data.storageLi2')}</li>
            </ul>

            <h4 className="font-semibold text-gray-800 pt-2">{t('legal.terms.data.rightsTitle')}</h4>
            <ul className="list-disc list-outside space-y-1 pl-5">
                <li>{t('legal.terms.data.rightsLi1')}</li>
            </ul>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.intellectualProperty.title')}</h3>
            <p>{t('legal.terms.intellectualProperty.p1')}</p>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.disclaimer.title')}</h3>
            <p>{t('legal.terms.disclaimer.p1')}</p>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.liability.title')}</h3>
            <p>{t('legal.terms.liability.p1')}</p>
            
            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.governingLaw.title')}</h3>
            <p>{t('legal.terms.governingLaw.p1')}</p>

            <h3 className="text-base font-semibold text-gray-900">{t('legal.terms.changes.title')}</h3>
            <p>{t('legal.terms.changes.p1')}</p>
        </div>
    );
};

export default TermsAndConditions;
