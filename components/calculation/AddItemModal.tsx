

import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { CalculationItem, AssetType, OperatingSystem, Brand, Condition, LeaseTerm, AdditionalService, ServiceSelection } from '../../types';
import { ASSET_TYPE_KEYS, BRAND_KEYS, CONDITION_KEYS, LEASE_TERMS, ADDITIONAL_SERVICE_KEYS, BASE_HARDWARE_COSTS, RELEVANT_OS_MAP_KEYS } from '../../constants';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<CalculationItem, 'id'>) => void;
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
    
    if (assetType === AssetType.Laptop || assetType === AssetType.Desktop || assetType === AssetType.Tablet) {
        return relevantOsKeys.filter(key => key !== 'MacOS' && key !== 'iOS');
    }

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
// FIX: Added missing 'packingServiceApplied' property to align with the CalculationItem type.
  packingServiceApplied: false,
};

const AddItemModal: React.FC<AddItemModalProps> = ({ isOpen, onClose, onAddItem }) => {
  const [formState, setFormState] = useState(initialFormState);

  const availableOsKeys = useMemo(() => {
    return getFilteredOsKeys(formState.assetType, formState.brand);
  }, [formState.assetType, formState.brand]);

  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState);
    }
  }, [isOpen]);

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
    setFormState({
      ...formState,
      assetType: newAssetType,
      hardwareCost: BASE_HARDWARE_COSTS[newAssetType] || 0
    });
  };
  
  const handleServiceToggle = (service: AdditionalService | 'Other') => {
    const existingService = formState.additionalServices.find(s => s.service === service);
    if (existingService) {
        setFormState(prev => ({...prev, additionalServices: prev.additionalServices.filter(s => s.service !== service)}));
    } else {
        const newService: ServiceSelection = { service, cost: 0 };
        if (service === 'Other') newService.description = '';
        setFormState(prev => ({...prev, additionalServices: [...prev.additionalServices, newService]}));
    }
  };

  const handleServiceValueChange = (service: AdditionalService | 'Other', field: 'cost' | 'description', value: string | number) => {
    setFormState(prev => ({
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
    onAddItem(formState);
    onClose();
  };

  const otherService = formState.additionalServices.find(s => s.service === 'Other');
  const nonReturnApplicableAssets: AssetType[] = [AssetType.Laptop, AssetType.Mobile, AssetType.Tablet];
  const isNonReturnApplied = (formState.nonReturnPercentage || 0) > 0;
  const isOtherAsset = formState.assetType === AssetType.OtherIT || formState.assetType === AssetType.Accessory;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Item">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Asset Type" value={formState.assetType} onChange={handleAssetTypeChange}>
            {ASSET_TYPE_KEYS.map(typeKey => <option key={typeKey} value={AssetType[typeKey]}>{AssetType[typeKey]}</option>)}
          </Select>
          <Select label="Brand" value={formState.brand} onChange={e => setFormState({...formState, brand: e.target.value as Brand})}>
            {BRAND_KEYS.map(brandKey => <option key={brandKey} value={Brand[brandKey]}>{Brand[brandKey]}</option>)}
          </Select>
          <Select label="Operating System" value={formState.operatingSystem || ''} onChange={e => setFormState({...formState, operatingSystem: e.target.value as OperatingSystem})} disabled={availableOsKeys.length === 0}>
            <option value="">{availableOsKeys.length === 0 ? "N/A" : "Operating System"}</option>
            {availableOsKeys.map(osKey => <option key={osKey} value={OperatingSystem[osKey]}>{OperatingSystem[osKey]}</option>)}
          </Select>
          <Select label="Condition" value={formState.condition} onChange={e => setFormState({...formState, condition: e.target.value as Condition})}>
            {CONDITION_KEYS.map(condKey => <option key={condKey} value={Condition[condKey]}>{Condition[condKey]}</option>)}
          </Select>
        </div>
        
        {isOtherAsset && (
            <Input 
                label="Asset Description" 
                value={formState.customDescription || ''} 
                onChange={e => setFormState({...formState, customDescription: e.target.value})}
                placeholder="e.g., High-performance scanner"
            />
        )}

        <Input label="Hardware Unit Price" type="number" value={formState.hardwareCost} onChange={e => setFormState({...formState, hardwareCost: parseFloat(e.target.value) || 0})} />
        
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Services (One-Time Cost)</label>
            <div className="space-y-2">
                {ADDITIONAL_SERVICE_KEYS.map(serviceKey => {
                    const serviceValue = AdditionalService[serviceKey];
                    const selection = formState.additionalServices.find(s => s.service === serviceValue);
                    return (
                        <div key={serviceKey} className="p-2 border rounded-md">
                            <label className="flex items-center space-x-2">
                                <input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={!!selection} onChange={() => handleServiceToggle(serviceValue)} />
                                <span className="text-sm text-gray-700 flex-grow">{serviceValue}</span>
                                {selection && (<div className="w-32"><Input type="number" placeholder="Cost" value={selection.cost} onChange={e => handleServiceValueChange(serviceValue, 'cost', e.target.value)} /></div>)}
                            </label>
                        </div>
                    )
                })}
                <div className="p-2 border rounded-md">
                   <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" checked={!!otherService} onChange={() => handleServiceToggle('Other')} /><span className="text-sm text-gray-700">Other Service</span></label>
                   {otherService && (<div className="mt-2 space-y-2 pl-6"><Input label="Description" value={otherService.description || ''} onChange={e => handleServiceValueChange('Other', 'description', e.target.value)} /><Input label="Cost" type="number" value={otherService.cost} onChange={e => handleServiceValueChange('Other', 'cost', e.target.value)} /></div>)}
                </div>
            </div>
        </div>

        {nonReturnApplicableAssets.includes(formState.assetType) && (
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Non-Return Option</label>
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
                        {isNonReturnApplied ? "Yes (5%)" : "No"}
                    </div>
                </button>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Lease Term (Months)" value={formState.leaseTerm} onChange={e => setFormState({...formState, leaseTerm: parseInt(e.target.value, 10) as LeaseTerm})}>
            {LEASE_TERMS.map(term => <option key={term} value={term}>{term}</option>)}
          </Select>
          <Input label="Number of Units" type="number" min="1" value={formState.quantity} onChange={e => setFormState({...formState, quantity: parseInt(e.target.value, 10) || 1})} />
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Add Item</Button>
      </div>
    </Modal>
  );
};

export default AddItemModal;