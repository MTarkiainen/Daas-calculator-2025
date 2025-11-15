
import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Profile } from '../../types';
import UploadIcon from '../ui/icons/UploadIcon';
import PasswordInput from '../ui/PasswordInput';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: Profile;
  setUser: (user: Profile) => void;
  onPasswordChange?: (newPass: string) => Promise<boolean>;
}

const validatePassword = (password: string): { key: string, message: string }[] => {
    const errors: { key: string, message: string }[] = [];
    if (password.length < 10) errors.push({ key: 'minLength', message: 'Must be at least 10 characters long.'});
    if (!/[a-z]/.test(password)) errors.push({ key: 'lowercase', message: 'Must contain at least one lowercase letter.'});
    if (!/[A-Z]/.test(password)) errors.push({ key: 'uppercase', message: 'Must contain at least one uppercase letter.'});
    if (!/\d/.test(password)) errors.push({ key: 'number', message: 'Must contain at least one number.'});
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push({ key: 'specialChar', message: 'Must contain at least one special character.'});
    return errors;
};

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, setUser, onPasswordChange }) => {
  const [profile, setProfile] = useState(user);
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [passwordErrors, setPasswordErrors] = useState<{ key: string, message: string }[]>([]);
  const [changePasswordError, setChangePasswordError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setProfile(user);
        setShowPasswordChange(false);
        setPasswords({ new: '', confirm: '' });
        setPasswordErrors([]);
        setChangePasswordError('');
    }
  }, [user, isOpen]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setProfile(prev => ({ ...prev, logoBase64: loadEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    
    if (showPasswordChange) {
        setChangePasswordError('');
        setPasswordErrors([]);
        if (!passwords.new || !passwords.confirm) {
            setChangePasswordError("All password fields are required.");
            return;
        }
        if (passwords.new !== passwords.confirm) {
            setChangePasswordError("The new passwords do not match.");
            return;
        }
        const errors = validatePassword(passwords.new);
        if (errors.length > 0) {
            setPasswordErrors(errors);
            return;
        }
        if (onPasswordChange) {
            const success = await onPasswordChange(passwords.new);
            if (!success) {
                // Error is alerted by parent component
                return;
            }
        }
    }
    setUser(profile);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="My Profile">
      <div className="space-y-4">
        <Input label="Name" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} />
        <Input label="Company Name" value={profile.companyName || ''} onChange={e => setProfile({...profile, companyName: e.target.value})} />
        <Input label="Phone" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} />
        <Input label="Email" type="email" value={profile.email} disabled />
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Logo</label>
          <div className="flex items-center space-x-4">
            {profile.logoBase64 && <img src={profile.logoBase64} alt="logo preview" className="h-16 w-32 object-contain rounded-md border p-1" />}
            <Button as="label" variant="secondary" leftIcon={<UploadIcon />}>
              Upload Logo
              <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
            </Button>
          </div>
        </div>
        
        <div className="pt-4 border-t">
            <Button variant="secondary" onClick={() => setShowPasswordChange(!showPasswordChange)}>
                Change Password
            </Button>
            {showPasswordChange && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                    <PasswordInput label="New Password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                    <PasswordInput label="Confirm New Password" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />

                    {(passwordErrors.length > 0 || changePasswordError) && (
                        <div className="text-xs text-red-600">
                            {changePasswordError && <p>{changePasswordError}</p>}
                            {passwordErrors.length > 0 && (
                                <ul className="list-disc list-inside mt-1">
                                    {passwordErrors.map(err => <li key={err.key}>{err.message}</li>)}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Save Profile</Button>
      </div>
    </Modal>
  );
};

export default ProfileModal;
