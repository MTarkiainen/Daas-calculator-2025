

import React, { useState, useEffect } from 'react';
import { LeaseRateFactorsData, LeaseTerm, Profile, UserRole, LeaseRateFactorsMap, AssetType, OperatingSystem, Brand } from '../../types';
import { LEASE_TERMS, ASSET_TYPE_KEYS, USED_ASSET_LRF_KEY, RELEVANT_OS_MAP_KEYS, BRAND_KEYS } from '../../constants';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import UploadIcon from '../ui/icons/UploadIcon';
import ChevronRightIcon from '../ui/icons/ChevronRightIcon';

interface LeaseRateManagementProps {
  lrfData: LeaseRateFactorsData;
  setLrfData: React.Dispatch<React.SetStateAction<LeaseRateFactorsData>>;
  users: Profile[];
  currentUser: Profile;
}

const createLrfKey = (assetType: AssetType, brand?: Brand, os?: OperatingSystem): string => {
  let key: string = assetType;
  if (assetType === AssetType.Mobile) {
    // For mobile, the key structure is AssetType-OS
    if (os) key += `-${os}`;
  } else {
    // For other types, the structure is AssetType-Brand-OS
    if (brand) key += `-${brand}`;
    if (os) key += `-${os}`;
  }
  return key;
};

const getRelevantOsForBrand = (assetTypeKey: keyof typeof AssetType, brandKey: keyof typeof Brand): (keyof typeof OperatingSystem)[] => {
    const relevantOsKeys = RELEVANT_OS_MAP_KEYS[assetTypeKey];
    if (!relevantOsKeys) return [];

    if (Brand[brandKey] === Brand.Apple) {
        const assetType = AssetType[assetTypeKey];
        if (assetType === AssetType.Laptop || assetType === AssetType.Desktop) {
            return ['MacOS'];
        }
        if (assetType === AssetType.Tablet || assetType === AssetType.Mobile) {
            return ['iOS'];
        }
    }
    
    const assetType = AssetType[assetTypeKey];
    // For non-Apple brands, remove Apple OS's from types where they don't apply.
    if (assetType === AssetType.Laptop || assetType === AssetType.Desktop || assetType === AssetType.Tablet) {
        return relevantOsKeys.filter(key => key !== 'MacOS' && key !== 'iOS');
    }
    
    // For non-Apple Mobile, and others, return the full list from constants.
    return relevantOsKeys;
};


const LeaseRateManagement: React.FC<LeaseRateManagementProps> = ({ lrfData, setLrfData, users, currentUser }) => {
  const locale = 'en-GB';
  const [factors, setFactors] = useState<LeaseRateFactorsMap>(lrfData.factors);
  const [notificationAdminId, setNotificationAdminId] = useState(lrfData.notificationAdminId);
  const [nonReturnUplift, setNonReturnUplift] = useState(lrfData.nonReturnUpliftFactor || 0.008);
  const [packingServiceCost, setPackingServiceCost] = useState(lrfData.packingServiceCost || 0);
  const [isDirty, setIsDirty] = useState(false);
  const [collapsedRows, setCollapsedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFactors(lrfData.factors);
    setNotificationAdminId(lrfData.notificationAdminId);
    setNonReturnUplift(lrfData.nonReturnUpliftFactor || 0.008);
    setPackingServiceCost(lrfData.packingServiceCost || 0);
    setIsDirty(false);
  }, [lrfData]);

  const toggleCollapse = (key: string) => {
    setCollapsedRows(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
            newSet.delete(key);
        } else {
            newSet.add(key);
        }
        return newSet;
    });
  };
  
  const handleFactorChange = (key: string, term: LeaseTerm, value: string) => {
    const numericValue = parseFloat(value) / 100; // Value is a percentage string
    
    setFactors(prev => {
        const newFactors = { ...prev };
        const newTermRates: Partial<Record<LeaseTerm, number>> = { ...(newFactors[key] || {}) };
        
        if (value === '' || isNaN(numericValue)) {
            delete newTermRates[term];
        } else {
            newTermRates[term] = numericValue;
        }

        if (Object.keys(newTermRates).length === 0) {
            delete newFactors[key];
        } else {
            newFactors[key] = newTermRates;
        }

        return newFactors;
    });
    setIsDirty(true);
  };

  const handleSave = () => {
    const newLogEntry = {
      timestamp: new Date().toISOString(),
      adminId: currentUser.id,
      adminName: currentUser.name,
    };

    setLrfData(prev => ({
      ...prev,
      factors,
      notificationAdminId,
      nonReturnUpliftFactor: nonReturnUplift,
      packingServiceCost: packingServiceCost,
      lastUpdatedAt: new Date().toISOString(),
      updatedByUserId: currentUser.id,
      updateLog: [newLogEntry, ...prev.updateLog],
    }));
    setIsDirty(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        
        try {
            const newFactors: LeaseRateFactorsMap = {};
            const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
            const header = lines[0].split(',').map(h => h.trim());
            
            if (header[0] !== 'key' || !LEASE_TERMS.every(term => header.includes(term.toString()))) {
                throw new Error("Invalid CSV header. The header must contain 'key' followed by the lease terms (12, 24, etc.).");
            }

            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const key = values[0].trim();
                if (!key) continue;

                const termRates: Partial<Record<LeaseTerm, number>> = {};
                for (let j = 1; j < header.length; j++) {
                    const term = parseInt(header[j], 10) as LeaseTerm;
                    const value = parseFloat(values[j]);
                    if (!isNaN(value)) {
                        termRates[term] = value / 100; // Convert from percentage
                    }
                }
                if (Object.keys(termRates).length > 0) {
                    newFactors[key] = termRates;
                }
            }

            if (Object.keys(newFactors).length === 0) {
              throw new Error("No valid LRF data found in the file.");
            }

            if (window.confirm("This will overwrite all current LRFs with data from the file. Are you sure you want to proceed?")) {
                setFactors(newFactors);
                setIsDirty(true);
                alert("LRFs imported successfully. Click 'Save Changes' to apply them.");
            }
        } catch (error) {
            alert(`Error parsing CSV file: ${error.message}`);
        }
        // Reset file input
        event.target.value = '';
    };
    reader.readAsText(file);
  };

  const createSampleCsv = (): string => {
    const header = ['key', ...LEASE_TERMS].join(',');
    const rows = [header];
    rows.push([USED_ASSET_LRF_KEY, '8.750', '4.375', '2.917', '2.188', '1.750'].join(','));
    ASSET_TYPE_KEYS.forEach(assetTypeKey => {
        const assetTypeValue = AssetType[assetTypeKey];
        rows.push([assetTypeValue, '', '', '', '', ''].join(','));
        
        if (assetTypeValue === AssetType.Mobile) {
            (RELEVANT_OS_MAP_KEYS.Mobile || []).forEach(osKey => {
                const osValue = OperatingSystem[osKey];
                rows.push([`${assetTypeValue}-${osValue}`, '', '', '', '', ''].join(','));
            });
        } else if (assetTypeValue !== AssetType.OtherIT && assetTypeValue !== AssetType.Accessory) {
            BRAND_KEYS.forEach(brandKey => {
                const brandValue = Brand[brandKey];
                rows.push([`${assetTypeValue}-${brandValue}`, '', '', '', '', ''].join(','));
                getRelevantOsForBrand(assetTypeKey, brandKey).forEach(osKey => {
                    const osValue = OperatingSystem[osKey];
                    rows.push([`${assetTypeValue}-${brandValue}-${osValue}`, '', '', '', '', ''].join(','));
                });
            });
        }
    });
    return rows.join('\n');
  };

  const getInheritedFactor = (key: string, term: LeaseTerm): number | undefined => {
    const lastHyphenIndex = key.lastIndexOf('-');
    if (lastHyphenIndex > -1) {
        const parentKey = key.substring(0, lastHyphenIndex);
        const parentFactor = factors[parentKey]?.[term];
        if (parentFactor !== undefined) return parentFactor;
        return getInheritedFactor(parentKey, term);
    }
    return undefined;
  };
  
  const getPlaceholder = (key: string, term: LeaseTerm): string => {
    const inheritedFactor = getInheritedFactor(key, term);
    if (typeof inheritedFactor === 'number') {
      const percentValue = inheritedFactor * 100;
      // Format to show 3 decimal places as per user example "2,555%"
      return percentValue.toFixed(3);
    }
    return '';
  };
  
  const renderFactorRow = (key: string, label: string, indentLevel: number, isHeader: boolean = false, hasChildren: boolean = false) => {
    const paddingLeft = `${1 + indentLevel * 1.5}rem`;
    const rowClass = isHeader ? 'bg-gray-100 font-semibold' : '';
    const borderClass = isHeader ? 'border-gray-200' : 'border-gray-100';
    const isCollapsed = collapsedRows.has(key);

    return (
        <tr key={key} className={rowClass}>
            <td className={`px-4 py-2 whitespace-nowrap text-sm text-gray-900 border-b ${borderClass}`} style={{ paddingLeft }}>
                 <div className="flex items-center">
                    {hasChildren ? (
                        <button onClick={() => toggleCollapse(key)} className="flex items-center text-left group">
                            <ChevronRightIcon className={`w-4 h-4 text-gray-500 group-hover:text-gray-800 transition-transform duration-150 ${isCollapsed ? '' : 'transform rotate-90'}`} />
                            <span className="ml-2">{label}</span>
                        </button>
                    ) : (
                        <span className="ml-6">{label}</span>
                    )}
                </div>
            </td>
            {LEASE_TERMS.map(term => (
              <td key={term} className={`p-1 border-b ${borderClass}`}>
                <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      min="0"
                      className="text-center w-28 text-sm pr-6"
                      value={factors[key]?.[term] !== undefined ? (factors[key][term] * 100).toFixed(3) : ''}
                      onChange={(e) => handleFactorChange(key, term, e.target.value)}
                      aria-label={`Factor for ${label} at ${term} months in percent`}
                      placeholder={getPlaceholder(key, term)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">%</span>
                    </div>
                </div>
              </td>
            ))}
        </tr>
    );
  };

  const adminUsers = users.filter(user => user.role === UserRole.Admin);

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-8">
      <div>
        <div className="flex flex-wrap gap-4 justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Lease Rate Factor Management</h2>
          <div className="flex gap-2">
             <Button as="label" variant="secondary" leftIcon={<UploadIcon />}>
                Upload CSV
                <input type="file" accept=".csv" className="sr-only" onChange={handleFileUpload} />
             </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Set specific lease rates. Empty fields will automatically use the rate from the parent category (e.g., 'Laptop-Windows' will use 'Laptop' rates if its own field is blank).
          <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(createSampleCsv())}`} download="lrf_template.csv" className="ml-2 text-brand-600 hover:underline font-medium">
            Download CSV template.
          </a> (You can edit this in Excel and save as a .csv file).
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">Category / OS / Brand</th>
                {LEASE_TERMS.map(term => (
                  <th key={term} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-b">{`${term} Months`}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
               {renderFactorRow(USED_ASSET_LRF_KEY, "All Used Assets", 0, true)}
               {ASSET_TYPE_KEYS.map(assetTypeKey => {
                const assetTypeValue = AssetType[assetTypeKey];
                const assetTypeLrfKey = createLrfKey(assetTypeValue);
                const isMobile = assetTypeValue === AssetType.Mobile;
                const hasBrands = !isMobile && assetTypeValue !== AssetType.OtherIT && assetTypeValue !== AssetType.Accessory;
                const assetTypeHasChildren = hasBrands || (isMobile && (RELEVANT_OS_MAP_KEYS.Mobile || []).length > 0);
                const isAssetTypeCollapsed = collapsedRows.has(assetTypeLrfKey);
                
                return (
                  <React.Fragment key={assetTypeKey}>
                    {renderFactorRow(assetTypeLrfKey, assetTypeValue, 0, true, assetTypeHasChildren)}
                    
                    {!isAssetTypeCollapsed && hasBrands && BRAND_KEYS.map(brandKey => {
                        const brandValue = Brand[brandKey];
                        const brandLrfKey = createLrfKey(assetTypeValue, brandValue);
                        const brandHasChildren = getRelevantOsForBrand(assetTypeKey, brandKey).length > 0;
                        const isBrandCollapsed = collapsedRows.has(brandLrfKey);
                        return (
                            <React.Fragment key={`${assetTypeKey}-${brandKey}`}>
                                {renderFactorRow(brandLrfKey, brandValue, 1, true, brandHasChildren)}
                                {!isBrandCollapsed && getRelevantOsForBrand(assetTypeKey, brandKey).map(osKey => {
                                    const osValue = OperatingSystem[osKey];
                                    const osLrfKey = createLrfKey(assetTypeValue, brandValue, osValue);
                                    return renderFactorRow(osLrfKey, osValue, 2);
                                })}
                            </React.Fragment>
                        )
                    })}

                    {!isAssetTypeCollapsed && isMobile && (RELEVANT_OS_MAP_KEYS.Mobile || []).map(osKey => {
                      const osValue = OperatingSystem[osKey];
                      const osLrfKey = createLrfKey(assetTypeValue, undefined, osValue);
                      return renderFactorRow(osLrfKey, osValue, 1);
                    })}
                  </React.Fragment>
                )
               })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
         <div>
            <h3 className="text-lg font-semibold mb-2">Global Calculation Settings</h3>
            <div className="max-w-sm space-y-4">
               <div>
                    <label htmlFor="non-return-uplift" className="block text-sm font-medium text-gray-700 mb-1">Non-Return Uplift (% per 1% non-return)</label>
                    <div className="relative">
                        <Input
                            id="non-return-uplift"
                            type="number"
                            step="0.1"
                            className="pr-8"
                            value={nonReturnUplift * 100}
                            onChange={e => {
                            setNonReturnUplift(parseFloat(e.target.value) / 100);
                            setIsDirty(true);
                            }}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <span className="text-gray-500 sm:text-sm">%</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">e.g., enter 0.8 for a 0.8% uplift on the LRF per 1% non-return. A 5% option will increase the LRF by 4%.</p>
               </div>
               <div>
                    <label htmlFor="packing-service-cost" className="block text-sm font-medium text-gray-700 mb-1">Packing Service Cost per Asset</label>
                    <Input
                        id="packing-service-cost"
                        type="number"
                        step="1"
                        value={packingServiceCost}
                        onChange={e => {
                            setPackingServiceCost(parseFloat(e.target.value) || 0);
                            setIsDirty(true);
                        }}
                    />
               </div>
            </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
          <p className="text-sm text-gray-600 mb-4">Select an admin to receive email notifications when partners request an LRF update.</p>
          <Select 
            label="Notification Recipient"
            value={notificationAdminId}
            onChange={e => {
              setNotificationAdminId(e.target.value);
              setIsDirty(true);
            }}
          >
            {adminUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
            ))}
          </Select>
        </div>
        <div>
           <h3 className="text-lg font-semibold mb-2">History Log</h3>
           <div className="max-h-48 overflow-y-auto border rounded-lg">
             <table className="min-w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lrfData.updateLog.map(log => (
                    <tr key={log.timestamp}>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString(locale)}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{log.adminName}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end">
        <Button onClick={handleSave} disabled={!isDirty}>
          {isDirty ? "Save Changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
};

export default LeaseRateManagement;