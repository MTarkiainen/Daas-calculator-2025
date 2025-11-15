
import React, { useState } from 'react';
import { Profile, UserRole, Quote, LeaseRateFactorsData, CalculationItem } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import PlusIcon from '../ui/icons/PlusIcon';
import UploadIcon from '../ui/icons/UploadIcon';
import { getLeaseRateFactor } from '../calculation/CalculationSheet';
import { COUNTRIES } from '../../constants';
import PasswordInput from '../ui/PasswordInput';
import { useLanguage } from '../../i18n/LanguageContext';

interface UserManagementProps {
  users: Profile[];
  onUserUpdate: (profile: Profile, newPasswordEntered: boolean) => Promise<void>;
  onUserCreate: (profileData: Partial<Profile>, password: string) => Promise<void>;
  savedQuotes: Quote[];
  lrfData: LeaseRateFactorsData;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUserUpdate, onUserCreate, savedQuotes, lrfData }) => {
  const { t, locale } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<Partial<Profile>>({});
  const [password, setPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<{ key: string, message: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const validatePassword = (password: string): { key: string, message: string }[] => {
    const errors: { key: string, message: string }[] = [];
    if (password.length < 10) errors.push({ key: 'minLength', message: t('password.error.minLength')});
    if (!/[a-z]/.test(password)) errors.push({ key: 'lowercase', message: t('password.error.lowercase')});
    if (!/[A-Z]/.test(password)) errors.push({ key: 'uppercase', message: t('password.error.uppercase')});
    if (!/\d/.test(password)) errors.push({ key: 'number', message: t('password.error.number')});
    if (!/[^a-zA-Z0-9]/.test(password)) errors.push({ key: 'specialChar', message: t('password.error.specialChar')});
    return errors;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(value);
  };
  
  const handleOpenModal = (user?: Profile) => {
    setCurrentUser(user || { role: UserRole.Partner, commissionPercentage: 0.5 });
    setPassword('');
    setPasswordErrors([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentUser({});
    setPassword('');
    setPasswordErrors([]);
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        setCurrentUser(prev => ({ ...prev, logoBase64: loadEvent.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveUser = async () => {
    if (!currentUser.name || !currentUser.email || !currentUser.role) {
      alert(t('admin.users.error.fillRequiredFields'));
      return;
    }
    
    if (currentUser.role === UserRole.Partner) {
        const commission = currentUser.commissionPercentage;
        if (commission !== undefined && (commission < 0 || commission > 100)) {
            alert(t('admin.users.error.commissionRange'));
            return;
        }
    }
    
    // Validate password if it's being set or changed
    if (password) {
        const errors = validatePassword(password);
        if (errors.length > 0) {
            setPasswordErrors(errors);
            return;
        }
    }

    setIsSaving(true);
    if (currentUser.id) {
      const userToUpdate = users.find(u => u.id === currentUser.id);
      if (userToUpdate) {
        // The user object from state might be stale, so we merge the updated fields
        // from the form `currentUser` into the latest `userToUpdate` from props.
        await onUserUpdate({ ...userToUpdate, ...currentUser }, password.length > 0);
      }
    } else {
      if (!password) {
        alert(t('admin.users.error.passwordRequired'));
        setIsSaving(false);
        return;
      }
      await onUserCreate(currentUser, password);
    }
    setIsSaving(false);
    handleCloseModal();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{t('admin.users.title')}</h2>
        <Button onClick={() => handleOpenModal()} leftIcon={<PlusIcon />}>{t('admin.users.addUserButton')}</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.table.name')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.table.emailCompany')}</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.table.role')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.table.totalCalculatedValue')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.table.totalCommissionEarned')}</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">{t('admin.users.table.actions')}</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map(user => {
              let totalValue = 0;
              let totalCommission = 0;

              if (user.role === UserRole.Partner) {
                const userQuotes = savedQuotes.filter(q => q.createdByUserId === user.id);
                const stats = userQuotes.reduce((acc, quote) => {
                  const quoteItems = quote.options.flatMap(o => o.items);
                  quoteItems.forEach(item => {
                      const lrf = getLeaseRateFactor(lrfData.factors, item, lrfData.nonReturnUpliftFactor || 0.008, user.commissionPercentage || 0);
                      const monthlyHardwareCost = lrf * item.hardwareCost;
                      const totalMonthlyCostForItem = monthlyHardwareCost * item.quantity;
                      const totalServicesCost = item.additionalServices.reduce((sum, service) => sum + service.cost, 0) * item.quantity;
                      const totalLeaseCost = (totalMonthlyCostForItem * item.leaseTerm) + totalServicesCost;
                      const commissionForItem = (item.hardwareCost * item.quantity) * ((user.commissionPercentage || 0) / 100);
                      
                      acc.totalValue += totalLeaseCost;
                      acc.totalCommission += commissionForItem;
                  });
                  return acc;
                }, { totalValue: 0, totalCommission: 0 });

                totalValue = stats.totalValue;
                totalCommission = stats.totalCommission;
              }

              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>{user.email}</div>
                      {user.role === UserRole.Partner && <div className="text-xs text-slate-400">{user.companyName}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === UserRole.Admin ? 'bg-brand-100 text-brand-800' : 'bg-chg-sage/20 text-chg-sage'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 text-right">
                      {user.role === UserRole.Partner ? formatCurrency(totalValue) : t('common.na')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-chg-sage font-medium text-right">
                      {user.role === UserRole.Partner ? formatCurrency(totalCommission) : t('common.na')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(user)} className="text-chg-active-blue hover:text-brand-900">{t('common.edit')}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentUser.id ? t('admin.users.modal.editTitle') : t('admin.users.modal.addTitle')}>
        <div className="space-y-4">
          <Input label={t('admin.users.modal.name')} value={currentUser.name || ''} onChange={e => setCurrentUser({...currentUser, name: e.target.value})} />
          <Input label={t('admin.users.modal.email')} type="email" value={currentUser.email || ''} onChange={e => setCurrentUser({...currentUser, email: e.target.value})} />
          <PasswordInput 
            label={currentUser.id ? t('admin.users.modal.resetPassword') : t('admin.users.modal.password')}
            value={password} 
            onChange={e => {
                setPassword(e.target.value);
                if (passwordErrors.length > 0) setPasswordErrors([]);
            }} 
            placeholder={currentUser.id ? t('admin.users.modal.passwordPlaceholderEdit') : ""}
          />
          {passwordErrors.length > 0 && (
            <ul className="list-disc list-inside text-xs text-red-600">
                {passwordErrors.map(err => <li key={err.key}>{err.message}</li>)}
            </ul>
          )}
          {currentUser.id && password && (
            <p className="text-xs text-yellow-600">{t('admin.users.modal.forceResetNote')}</p>
          )}

          <Select label={t('admin.users.modal.role')} value={currentUser.role || ''} onChange={e => setCurrentUser({...currentUser, role: e.target.value as UserRole})}>
            <option value="">{t('admin.users.modal.selectRole')}</option>
            {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
          </Select>
          {currentUser.role === UserRole.Partner && (
            <div className="p-4 border-t mt-4 space-y-4">
              <h4 className="font-semibold text-slate-700">{t('admin.users.modal.partnerDetailsTitle')}</h4>
              <Input label={t('admin.users.modal.companyName')} value={currentUser.companyName || ''} onChange={e => setCurrentUser({...currentUser, companyName: e.target.value})} />
              <Input label={t('admin.users.modal.phone')} value={currentUser.phone || ''} onChange={e => setCurrentUser({...currentUser, phone: e.target.value})} />
              <Select label={t('admin.users.modal.country')} value={currentUser.country || ''} onChange={e => setCurrentUser({...currentUser, country: e.target.value})}>
                <option value="">{t('admin.users.modal.selectCountry')}</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </Select>
              <div>
                <Input 
                  label={t('admin.users.modal.commission')} 
                  type="number" 
                  value={currentUser.commissionPercentage || 0} 
                  onChange={e => {
                      const val = parseFloat(e.target.value);
                      setCurrentUser({...currentUser, commissionPercentage: isNaN(val) ? 0 : val});
                  }}
                  step="0.1"
                />
                <p className="text-xs text-slate-500 mt-1">{t('admin.users.modal.commissionHelpText')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.users.modal.companyLogo')}</label>
                <div className="flex items-center space-x-4">
                  {currentUser.logoBase64 && <img src={currentUser.logoBase64} alt="logo preview" className="h-12 w-12 object-contain rounded-md border" />}
                  <Button as="label" variant="secondary" leftIcon={<UploadIcon />}>
                    {t('admin.users.modal.uploadLogoButton')}
                    <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-2">
            <Button variant="secondary" onClick={handleCloseModal} disabled={isSaving}>{t('common.cancel')}</Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>{isSaving ? t('common.saving') : t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;
