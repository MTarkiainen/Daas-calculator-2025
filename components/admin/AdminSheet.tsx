

import React from 'react';
import { Profile, LeaseRateFactorsData, LoginAttempt, BrandingSettings, Quote, WorkflowSettings, ActivityLogEntry } from '../../types';
import UserManagement from './UserManagement';
import LeaseRateManagement from './LeaseRateManagement';
import LoginHistory from './LoginHistory';
import BrandingManagement from './BrandingManagement';
import WorkflowManagement from './WorkflowManagement';
import ActivityLog from './ActivityLog';


interface AdminSheetProps {
  profiles: Profile[];
  onUserUpdate: (profile: Profile, newPasswordEntered: boolean) => Promise<void>;
  onUserCreate: (profileData: Partial<Profile>, password: string) => Promise<void>;
  lrfData: LeaseRateFactorsData;
  setLrfData: React.Dispatch<React.SetStateAction<LeaseRateFactorsData>>;
  currentUser: Profile;
  loginHistory: LoginAttempt[];
  brandingSettings: BrandingSettings;
  setBrandingSettings: React.Dispatch<React.SetStateAction<BrandingSettings>>;
  savedQuotes: Quote[];
  workflowSettings: WorkflowSettings;
  setWorkflowSettings: React.Dispatch<React.SetStateAction<WorkflowSettings>>;
  activityLog: ActivityLogEntry[];
}

const AdminSheet: React.FC<AdminSheetProps> = ({ 
  profiles, onUserUpdate, onUserCreate,
  lrfData, setLrfData, 
  currentUser, 
  loginHistory, 
  brandingSettings, setBrandingSettings, 
  savedQuotes,
  workflowSettings, setWorkflowSettings,
  activityLog
}) => {
  return (
    <div className="space-y-8">
      <BrandingManagement brandingSettings={brandingSettings} setBrandingSettings={setBrandingSettings} />
      <WorkflowManagement workflowSettings={workflowSettings} setWorkflowSettings={setWorkflowSettings} />
      <UserManagement 
        users={profiles} 
        onUserUpdate={onUserUpdate}
        onUserCreate={onUserCreate}
        savedQuotes={savedQuotes}
        lrfData={lrfData}
      />
      <LeaseRateManagement 
        lrfData={lrfData} 
        setLrfData={setLrfData} 
        users={profiles}
        currentUser={currentUser}
      />
      <ActivityLog activityLog={activityLog} users={profiles} />
      <LoginHistory loginHistory={loginHistory} users={profiles} />
    </div>
  );
};

export default AdminSheet;
