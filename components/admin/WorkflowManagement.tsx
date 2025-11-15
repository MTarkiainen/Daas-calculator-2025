
import React, { useState } from 'react';
import { WorkflowSettings, SubstituteRecipient } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { v4 as uuidv4 } from 'uuid';
import TrashIcon from '../ui/icons/TrashIcon';

interface WorkflowManagementProps {
  workflowSettings: WorkflowSettings;
  setWorkflowSettings: React.Dispatch<React.SetStateAction<WorkflowSettings>>;
}

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({ workflowSettings, setWorkflowSettings }) => {
  const locale = 'en-GB';
  const [primaryEmail, setPrimaryEmail] = useState(workflowSettings.primaryCreditApprovalEmail);
  const [substitute, setSubstitute] = useState({ email: '', startDate: '', endDate: '' });

  const handleSavePrimaryEmail = () => {
    setWorkflowSettings(prev => ({ ...prev, primaryCreditApprovalEmail: primaryEmail }));
    alert('Primary email updated!');
  };

  const handleAddSubstitute = () => {
    if (!substitute.email || !substitute.startDate || !substitute.endDate) {
      alert("Please fill in all fields for the substitute.");
      return;
    }
    const newSubstitute: SubstituteRecipient = { ...substitute, id: uuidv4() };
    setWorkflowSettings(prev => ({ ...prev, substitutes: [...prev.substitutes, newSubstitute] }));
    setSubstitute({ email: '', startDate: '', endDate: '' });
  };
  
  const handleRemoveSubstitute = (id: string) => {
    if (window.confirm("Are you sure you want to remove this substitute?")) {
        setWorkflowSettings(prev => ({ ...prev, substitutes: prev.substitutes.filter(s => s.id !== id) }));
    }
  };
  
  const getRecipientEmail = () => {
    const today = new Date().toISOString().split('T')[0];
    const activeSubstitute = workflowSettings.substitutes.find(s => 
        s.startDate <= today && s.endDate >= today
    );
    return activeSubstitute?.email || workflowSettings.primaryCreditApprovalEmail;
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-8">
      <h2 className="text-xl font-semibold border-b pb-2">Workflow & Notifications</h2>
      
      {/* Primary Email */}
      <div>
        <h3 className="text-lg font-medium">Credit Approval Recipient</h3>
        <p className="text-sm text-gray-500 mb-2">This email address will receive all credit approval requests sent by partners.</p>
        <div className="flex items-center space-x-2">
          <Input 
            type="email"
            value={primaryEmail}
            onChange={e => setPrimaryEmail(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleSavePrimaryEmail} disabled={primaryEmail === workflowSettings.primaryCreditApprovalEmail}>Save</Button>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="text-sm font-medium text-blue-800">Current Recipient: </span>
          <span className="text-sm font-bold text-blue-900">{getRecipientEmail()}</span>
        </div>
      </div>
      
      {/* Substitutes */}
      <div>
        <h3 className="text-lg font-medium">Vacation / Substitute Forwarding</h3>
        <p className="text-sm text-gray-500 mb-2">Add a substitute email address for a specific time frame. Requests will be automatically forwarded if the date falls within the range.</p>
        
        <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
           <h4 className="font-semibold text-gray-700">Add New Substitute</h4>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input 
                label="Substitute Email" 
                type="email" 
                value={substitute.email}
                onChange={e => setSubstitute(s => ({ ...s, email: e.target.value }))}
              />
              <Input 
                label="Start Date" 
                type="date"
                value={substitute.startDate}
                onChange={e => setSubstitute(s => ({ ...s, startDate: e.target.value }))}
              />
              <Input 
                label="End Date" 
                type="date"
                value={substitute.endDate}
                onChange={e => setSubstitute(s => ({ ...s, endDate: e.target.value }))}
              />
           </div>
           <div className="flex justify-end">
               <Button onClick={handleAddSubstitute}>Add Substitute</Button>
           </div>
        </div>

        <div className="mt-4 max-h-60 overflow-y-auto">
            <table className="min-w-full">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Substitute Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {workflowSettings.substitutes.map(sub => {
                        const isActive = sub.startDate <= today && sub.endDate >= today;
                        const isPast = sub.endDate < today;
                        return (
                        <tr key={sub.id} className={isActive ? "bg-green-100 border-l-4 border-green-500" : ""}>
                            <td className="px-4 py-2 text-sm">{sub.email}</td>
                            <td className="px-4 py-2 text-sm">{new Date(sub.startDate).toLocaleDateString(locale)}</td>
                            <td className="px-4 py-2 text-sm">{new Date(sub.endDate).toLocaleDateString(locale)}</td>
                            <td className="px-4 py-2 text-sm">
                                {isActive && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-200 text-green-800">Active</span>}
                                {isPast && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-200 text-gray-800">Past</span>}
                                {!isActive && !isPast && <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-200 text-blue-800">Upcoming</span>}
                            </td>
                            <td className="px-4 py-2 text-right">
                                <Button variant="danger" size="sm" onClick={() => handleRemoveSubstitute(sub.id)}><TrashIcon /></Button>
                            </td>
                        </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default WorkflowManagement;
