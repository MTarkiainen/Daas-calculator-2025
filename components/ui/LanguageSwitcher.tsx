
import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { languages } from '../../i18n/languages';
import ChevronDownIcon from './icons/ChevronDownIcon';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectLanguage = (lang: typeof languages[0]) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const CurrentFlag = language.flag;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-1.5 bg-white text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
      >
        <CurrentFlag className="w-5 h-5 rounded-sm" />
        <span className="text-sm font-medium">{language.code.toUpperCase()}</span>
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5">
          <ul className="py-1">
            {languages.map((lang) => {
              const FlagComponent = lang.flag;
              return (
                <li key={lang.code}>
                  <button
                    onClick={() => handleSelectLanguage(lang)}
                    className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <FlagComponent className="w-5 h-5 rounded-sm" />
                    <span>{lang.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;