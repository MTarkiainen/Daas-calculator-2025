
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LibraryAsset, AssetType, Brand, OperatingSystem, Condition, AdditionalService, ServiceSelection } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import PlusIcon from '../ui/icons/PlusIcon';
import TrashIcon from '../ui/icons/TrashIcon';
import { useLanguage } from '../../i18n/LanguageContext';
import { ASSET_TYPE_KEYS, BRAND_KEYS, CONDITION_KEYS, ADDITIONAL_SERVICE_KEYS, RELEVANT_OS_MAP_KEYS, COUNTRIES, BASE_HARDWARE_COSTS } from '../../constants';

interface AssetLibraryManagementProps {
  libraryAssets: LibraryAsset[];
  onSave: (asset: LibraryAsset) => Promise<void>;
  onDelete: (assetId: string) => Promise<void>;
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
        if (assetType === AssetType.Laptop || assetType === AssetType.Desktop) return ['MacOS'];
        if (assetType === AssetType.Tablet || assetType === AssetType.Mobile) return ['iOS'];
    }
    if (assetType === AssetType.Laptop || assetType === AssetType.Desktop || assetType === AssetType.Tablet) {
        return relevantOsKeys.filter(key => key !== 'MacOS' && key !== 'iOS');
    }
    return relevantOsKeys;
};

const AssetLibraryManagement: React.FC<AssetLibraryManagementProps> = ({ libraryAssets, onSave, onDelete }) => {
  const { t, locale } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAsset, setCurrentAsset] = useState<Partial<LibraryAsset> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  };

  const handleOpenModal = (asset?: LibraryAsset) => {
    setCurrentAsset(asset || { 
      assetType: AssetType.Laptop,
      brand: Brand.HP,
      condition: Condition.New,
      operatingSystem: OperatingSystem.Windows,
      hardwareCost: BASE_HARDWARE_COSTS[AssetType.Laptop],
      additionalServices: [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAsset(null);
  };

  const handleSave = async () => {
    if (!currentAsset || !currentAsset.name || !currentAsset.assetType || !currentAsset.brand) {
      alert("Please fill in all required fields.");
      return;
    }
    setIsSaving(true);
    await onSave({
        id: uuidv4(),
        ...currentAsset,
    } as LibraryAsset);
    setIsSaving(false);
    handleCloseModal();
  };

  const handleDelete = (assetId: string) => {
    if (window.confirm(t('admin.assetLibrary.confirmDelete'))) {
      onDelete(assetId);
    }
  };

  const handleAssetChange = (field: keyof LibraryAsset, value: any) => {
    setCurrentAsset(prev => prev ? { ...prev, [field]: value } : null);
  };

  const availableOsKeys = useMemo(() => {
    if (!currentAsset?.assetType || !currentAsset?.brand) return [];
    return getFilteredOsKeys(currentAsset.assetType, currentAsset.brand);
  }, [currentAsset?.assetType, currentAsset?.brand]);
  
  useEffect(() => {
    if (!currentAsset) return;
    const currentOsKey = currentAsset.operatingSystem ? getKeyByValue(OperatingSystem, currentAsset.operatingSystem) : null;
    if (currentOsKey && !availableOsKeys.includes(currentOsKey as any)) {
      const newOsKey = availableOsKeys[0];
      handleAssetChange('operatingSystem', newOsKey ? OperatingSystem[newOsKey] : null);
    } else if (availableOsKeys.length === 0 && currentAsset.operatingSystem) {
      handleAssetChange('operatingSystem', null);
    }
  }, [availableOsKeys, currentAsset]);

  const handleServiceToggle = (service: AdditionalService | 'Other') => {
    if (!currentAsset) return;
    const exists = currentAsset.additionalServices?.some(s => s.service === service);
    const additionalServices = exists
      ? currentAsset.additionalServices?.filter(s => s.service !== service)
      : [...(currentAsset.additionalServices || []), { service, cost: 0, ...(service === 'Other' && { description: '' }) }];
    handleAssetChange('additionalServices', additionalServices);
  };

  const handleServiceValueChange = (service: AdditionalService | 'Other', field: 'cost' | 'description', value: string | number) => {
    if (!currentAsset) return;
    const services = currentAsset.additionalServices?.map(s => s.service === service ? { ...s, [field]: value } : s) || [];
    handleAssetChange('additionalServices', services);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
            <h2 className="text-xl font-semibold">{t('admin.assetLibrary.title')}</h2>
            <p className="text-sm text-slate-500">{t('admin.assetLibrary.description')}</p>
        </div>
        <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon />}>{t('admin.assetLibrary.addNew')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.assetLibrary.table.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.assetLibrary.table.type')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.assetLibrary.table.brand')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.assetLibrary.table.cost')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.assetLibrary.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {libraryAssets.map(asset => (
              <tr key={asset.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{asset.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{asset.assetType}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{asset.brand}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">{formatCurrency(asset.hardwareCost)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                  <button onClick={() => handleOpenModal(asset)} className="text-chg-active-blue hover:text-brand-900">{t('common.edit')}</button>
                  <button onClick={() => handleDelete(asset.id)} className="text-red-600 hover:text-red-900"><TrashIcon /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentAsset && (
        <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentAsset.id ? t('admin.assetLibrary.modal.editTitle') : t('admin.assetLibrary.modal.addTitle')}>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <Input label={t('admin.assetLibrary.modal.name')} value={currentAsset.name || ''} onChange={e => handleAssetChange('name', e.target.value)} placeholder={t('admin.assetLibrary.modal.namePlaceholder')} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label={t('calculation.wizard.assetType')} value={currentAsset.assetType} onChange={e => handleAssetChange('assetType', e.target.value as AssetType)}>
                {ASSET_TYPE_KEYS.map(key => <option key={key} value={AssetType[key]}>{AssetType[key]}</option>)}
              </Select>
              <Select label={t('calculation.wizard.brand')} value={currentAsset.brand} onChange={e => handleAssetChange('brand', e.target.value as Brand)}>
                {BRAND_KEYS.map(key => <option key={key} value={Brand[key]}>{Brand[key]}</option>)}
              </Select>
              <Select label={t('calculation.wizard.os')} value={currentAsset.operatingSystem || ''} onChange={e => handleAssetChange('operatingSystem', e.target.value as OperatingSystem)} disabled={availableOsKeys.length === 0}>
                <option value="">{availableOsKeys.length === 0 ? t('common.na') : t('calculation.wizard.os')}</option>
                {availableOsKeys.map(key => <option key={key} value={OperatingSystem[key]}>{OperatingSystem[key]}</option>)}
              </Select>
              <Select label={t('calculation.wizard.condition')} value={currentAsset.condition} onChange={e => handleAssetChange('condition', e.target.value as Condition)}>
                {CONDITION_KEYS.map(key => <option key={key} value={Condition[key]}>{Condition[key]}</option>)}
              </Select>
            </div>
            <Select label={t('calculation.wizard.country')} value={currentAsset.country || ''} onChange={e => handleAssetChange('country', e.target.value)}>
              <option value="">{t('calculation.wizard.selectCountry')}</option>
              {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
            </Select>
            <Input label={t('calculation.wizard.hardwareCost', {currency: 'EUR'})} type="number" value={currentAsset.hardwareCost} onChange={e => handleAssetChange('hardwareCost', parseFloat(e.target.value) || 0)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin.assetLibrary.modal.services')}</label>
              <div className="space-y-2">
                {ADDITIONAL_SERVICE_KEYS.map(serviceKey => {
                  const serviceValue = AdditionalService[serviceKey];
                  const selection = currentAsset.additionalServices?.find(s => s.service === serviceValue);
                  return (
                    <div key={serviceKey} className="p-2 border rounded-md">
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" checked={!!selection} onChange={() => handleServiceToggle(serviceValue)} />
                        <span className="flex-grow">{serviceValue}</span>
                        {selection && <div className="w-32"><Input type="number" placeholder="Cost" value={selection.cost} onChange={e => handleServiceValueChange(serviceValue, 'cost', e.target.value)} /></div>}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={isSaving}>{isSaving ? t('common.saving') : t('common.save')}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetLibraryManagement;
