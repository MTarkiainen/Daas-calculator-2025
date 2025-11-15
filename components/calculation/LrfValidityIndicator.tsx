
import React from 'react';
import { LeaseRateFactorsData, Profile } from '../../types';
import InformationCircleIcon from '../ui/icons/InformationCircleIcon';

interface LrfValidityIndicatorProps {
  lrfData: LeaseRateFactorsData;
  users: Profile[];
}

const LrfValidityIndicator: React.FC<LrfValidityIndicatorProps> = ({ lrfData, users }) => {
  const locale = 'en-GB';
  const lastUpdateDate = new Date(lrfData.lastUpdatedAt);
  
  const expiryDate = new Date(lastUpdateDate);
  expiryDate.setMonth(expiryDate.getMonth() + 6);

  const isExpired = new Date() > expiryDate;
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));

  const lastUpdateUser = users.find(u => u.id === lrfData.updatedByUserId);
  const notificationAdmin = users.find(u => u.id === lrfData.notificationAdminId);

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  const handleRequestUpdate = () => {
    if (notificationAdmin) {
      alert(`An email has been sent to ${notificationAdmin.name} (${notificationAdmin.email}) requesting an update to the Lease Rate Factors.`);
    } else {
      alert("Notification admin not found. Please contact support.");
    }
  };

  const getStatusClasses = () => {
    if (isExpired) {
      return 'text-red-600';
    }
    if (daysUntilExpiry <= 30) {
      return 'text-yellow-600';
    }
    return 'text-slate-500';
  };

  const getIcon = () => {
    if (isExpired || daysUntilExpiry <= 30) {
      return <InformationCircleIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />;
    }
    return null;
  };

  let message;
  if (isExpired) {
    message = "These rates are more than 6 months old and may be out of date.";
  } else if (daysUntilExpiry <= 30) {
    message = `These rates will expire in ${daysUntilExpiry} days.`;
  } else {
    message = `Rates valid until: ${formatDate(expiryDate)}`;
  }

  const fullDetails = `Last updated on ${formatDate(lastUpdateDate)} by ${lastUpdateUser?.name || "Unknown User"}`;

  return (
    <div className={`text-xs ${getStatusClasses()}`} title={fullDetails}>
      <div className="flex items-center">
        {getIcon()}
        <span className="truncate">{message}</span>
        {isExpired && (
          <button onClick={handleRequestUpdate} className="ml-2 text-red-700 underline hover:text-red-900 focus:outline-none flex-shrink-0">
            Request Update
          </button>
        )}
      </div>
    </div>
  );
};

export default LrfValidityIndicator;
