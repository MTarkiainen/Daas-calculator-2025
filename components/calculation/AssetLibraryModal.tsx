
import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { LibraryAsset, CalculationItem, LeaseTerm } from '../../types';
import { LEASE_TERMS } from '../../constants';
import { useLanguage } from '../../i18n/LanguageContext';
import ChevronLeftIcon from '../ui/icons/ChevronLeftIcon';

interface AssetLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryAssets: LibraryAsset[];
  onAddItems: (items: Omit<CalculationItem, 'id'>[]) => void;
  currency: string;
}

type ConfiguredAsset = {
  asset: LibraryAsset;
  quantity: number;
  leaseTerm: LeaseTerm;
};

const AssetLibraryModal: React.FC<AssetLibraryModalProps> = ({ isOpen, onClose, libraryAssets, onAddItems, currency }) => {
  const { t, locale } = useLanguage();
  const [view, setView] = useState<'select' | 'configure'>('select');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [configuredAssets, setConfiguredAssets] = useState<ConfiguredAsset[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
  };

  const handleToggleSelection = (assetId: string) => {
    setSelectedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const handleGoToConfigure = () => {
    const assetsToConfigure = libraryAssets
      .filter(asset => selectedAssetIds.has(asset.id))
      .map(asset => ({ asset, quantity: 1, leaseTerm: 36 as LeaseTerm }));
    setConfiguredAssets(assetsToConfigure);
    setView('configure');
  };

  const handleConfigurationChange = (assetId: string, field: 'quantity' | 'leaseTerm', value: number) => {
    setConfiguredAssets(prev =>
      prev.map(item =>
        item.asset.id === assetId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleAddItemsToQuote = () => {
    const items: Omit<CalculationItem, 'id'>[] = configuredAssets.map(({ asset, quantity, leaseTerm }) => ({
      assetType: asset.assetType,
      customDescription: asset.customDescription,
      operatingSystem: asset.operatingSystem,
      brand: asset.brand,
      condition: asset.condition,
      additionalServices: asset.additionalServices,
      hardwareCost: asset.hardwareCost,
      country: asset.country,
      leaseTerm,
      quantity,
      nonReturnPercentage: 0,
      packingServiceApplied: false,
    }));
    onAddItems(items);
    handleClose();
  };
  
  const handleClose = () => {
    onClose();
    // Reset state after a delay to allow for closing animation
    setTimeout(() => {
        setView('select');
        setSearchTerm('');
        setSelectedAssetIds(new Set());
        setConfiguredAssets([]);
    }, 300);
  };

  const filteredAssets = libraryAssets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    asset.assetType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderSelectView = () => (
    <>
      <Input
        placeholder={t('libraryModal.searchPlaceholder')}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
        {filteredAssets.length > 0 ? filteredAssets.map(asset => (
          <label key={asset.id} className="flex items-center p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
              checked={selectedAssetIds.has(asset.id)}
              onChange={() => handleToggleSelection(asset.id)}
            />
            <div className="ml-3 flex-grow">
              <p className="font-semibold text-slate-800">{asset.name}</p>
              <p className="text-sm text-slate-500">{asset.assetType} - {asset.brand}</p>
            </div>
            <p className="text-sm font-medium text-slate-700">{formatCurrency(asset.hardwareCost)}</p>
          </label>
        )) : <p className="text-center text-slate-500 py-8">{t('libraryModal.noResults')}</p>}
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={handleGoToConfigure} disabled={selectedAssetIds.size === 0}>
          {t('libraryModal.buttons.configure', { count: selectedAssetIds.size })}
        </Button>
      </div>
    </>
  );

  const renderConfigureView = () => (
    <>
      <p className="text-sm text-slate-600 mb-4">{t('libraryModal.configureDescription')}</p>
      <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
        {configuredAssets.map(({ asset, quantity, leaseTerm }) => (
          <div key={asset.id} className="p-4 border rounded-lg">
            <p className="font-semibold text-slate-800">{asset.name}</p>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <Select
                label={t('libraryModal.leaseTerm')}
                value={leaseTerm}
                onChange={e => handleConfigurationChange(asset.id, 'leaseTerm', parseInt(e.target.value) as LeaseTerm)}
              >
                {LEASE_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
              </Select>
              <Input
                label={t('libraryModal.quantity')}
                type="number"
                min="1"
                value={quantity}
                onChange={e => handleConfigurationChange(asset.id, 'quantity', parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
        ))}
      </div>
       <div className="mt-6 flex justify-between">
        <Button variant="secondary" onClick={() => setView('select')} leftIcon={<ChevronLeftIcon />}>{t('common.back')}</Button>
        <Button onClick={handleAddItemsToQuote}>
          {t('libraryModal.buttons.addSelected', { count: configuredAssets.length })}
        </Button>
      </div>
    </>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={view === 'select' ? t('libraryModal.title') : t('libraryModal.configureTitle')}>
        {view === 'select' ? renderSelectView() : renderConfigureView()}
    </Modal>
  );
};

export default AssetLibraryModal;
