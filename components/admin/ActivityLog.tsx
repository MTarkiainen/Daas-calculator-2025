
import React from 'react';
import { ActivityLogEntry, Profile, ActivityType } from '../../types';

interface ActivityLogProps {
  activityLog: ActivityLogEntry[];
  users: Profile[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activityLog, users }) => {
  const locale = 'en-GB';

  const getUserName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || userId;
  };

  const getActivityTranslation = (type: ActivityType) => {
    const translations: Record<ActivityType, string> = {
      [ActivityType.CreditRequestSent]: "Credit Request Sent",
    };
    return translations[type] || type;
  };
  
  const getDetails = (log: ActivityLogEntry) => {
    return `Customer: ${log.customerName || 'N/A'}, Quote ID: ${log.quoteId?.substring(0, 8)}... - ${log.details}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Activity Log</h2>
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {activityLog.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activityLog.map(log => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString(locale)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getUserName(log.userId)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getActivityTranslation(log.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={log.details}>{getDetails(log)}</td>
                  </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-8">No activity has been recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default ActivityLog;
