
import React from 'react';
import FlagEN from '../components/ui/icons/flags/FlagEN';
import FlagDE from '../components/ui/icons/flags/FlagDE';
import FlagFI from '../components/ui/icons/flags/FlagFI';
import FlagSV from '../components/ui/icons/flags/FlagSV';
import FlagNO from '../components/ui/icons/flags/FlagNO';
import FlagDA from '../components/ui/icons/flags/FlagDA';
import FlagPL from '../components/ui/icons/flags/FlagPL';
import FlagCZ from '../components/ui/icons/flags/FlagCZ';

export interface Language {
  name: string;
  code: string;
  locale: string;
  flag: React.FC<React.SVGProps<SVGSVGElement>>;
}

export const languages: Language[] = [
  { name: 'English', code: 'en', locale: 'en-GB', flag: FlagEN },
  { name: 'Deutsch', code: 'de', locale: 'de-DE', flag: FlagDE },
  { name: 'Suomi', code: 'fi', locale: 'fi-FI', flag: FlagFI },
  { name: 'Svenska', code: 'sv', locale: 'sv-SE', flag: FlagSV },
  { name: 'Norsk', code: 'no', locale: 'nb-NO', flag: FlagNO },
  { name: 'Dansk', code: 'da', locale: 'da-DK', flag: FlagDA },
  { name: 'Polski', code: 'pl', locale: 'pl-PL', flag: FlagPL },
  { name: 'Čeština', code: 'cs', locale: 'cs-CZ', flag: FlagCZ },
];