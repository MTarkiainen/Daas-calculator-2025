
import React, { useState, useEffect } from 'react';
import { BrandingSettings } from '../../types';
import { Button } from '../ui/Button';
import UploadIcon from '../ui/icons/UploadIcon';
import TrashIcon from '../ui/icons/TrashIcon';
import CompanyLogo from '../ui/icons/CompanyLogo';

interface BrandingManagementProps {
  brandingSettings: BrandingSettings;
  setBrandingSettings: React.Dispatch<React.SetStateAction<BrandingSettings>>;
}

const BrandingManagement: React.FC<BrandingManagementProps> = ({ brandingSettings, setBrandingSettings }) => {
  const [localSettings, setLocalSettings] = useState<BrandingSettings>(brandingSettings);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalSettings(brandingSettings);
    setIsDirty(false);
  }, [brandingSettings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setLocalSettings(prev => ({ ...prev, appLogoBase64: loadEvent.target?.result as string }));
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    if (window.confirm("Are you sure you want to remove the custom logo and revert to the default?")) {
        setLocalSettings(prev => ({ ...prev, appLogoBase64: null }));
        setIsDirty(true);
    }
  };

  const handleSaveChanges = () => {
    setBrandingSettings(localSettings);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Branding Management</h2>
        <Button onClick={handleSaveChanges} disabled={!isDirty}>
          {isDirty ? 'Save Changes' : 'Saved'}
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Application Logo (Login Page)</label>
          <div className="flex items-center space-x-6 p-4 border rounded-lg">
            <div className="flex-shrink-0">
              <p className="text-xs text-gray-500 mb-1">Logo Preview</p>
              {localSettings.appLogoBase64 ? (
                <img src={localSettings.appLogoBase64} alt="App Logo Preview" className="h-16 w-32 object-contain rounded-md border p-1 bg-gray-50" />
              ) : (
                <div className="h-16 w-32 flex items-center justify-center rounded-md border p-1 bg-gray-50">
                    <CompanyLogo className="h-10 w-auto text-brand-500" />
                </div>
              )}
            </div>
            <div className="flex-grow">
               <p className="text-xs text-gray-500 mb-1">Upload a new logo</p>
               <div className="flex items-center space-x-2">
                 <Button as="label" variant="secondary" leftIcon={<UploadIcon />}>
                   Upload Logo
                   <input type="file" accept="image/png, image/jpeg, image/svg+xml" className="sr-only" onChange={handleLogoUpload} />
                 </Button>
                 {localSettings.appLogoBase64 && (
                    <Button variant="danger" onClick={handleRemoveLogo} aria-label="Remove Custom Logo">
                        <TrashIcon />
                    </Button>
                 )}
               </div>
               <p className="text-xs text-gray-500 mt-2">Recommended: SVG or PNG with transparent background.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandingManagement;
