
import React from 'react';
import { LoginAttempt, Profile } from '../../types';

interface LoginHistoryProps {
  loginHistory: LoginAttempt[];
  users: Profile[];
}

const LoginHistory: React.FC<LoginHistoryProps> = ({ loginHistory, users }) => {
  const locale = 'en-GB';

  const sortedHistory = [...loginHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getUserName = (userId?: string) => {
    if (!userId) return null;
    return users.find(u => u.id === userId)?.name || null;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Login History</h2>
      <div className="max-h-96 overflow-y-auto border rounded-lg">
        {sortedHistory.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedHistory.map(log => {
                const userName = getUserName(log.userId);
                return (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.timestamp).toLocaleString(locale)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userName ? (
                        <span>{userName}</span>
                      ) : (
                        <span className="italic text-gray-500" title={`Attempted Email: ${log.emailAttempt}`}>{log.emailAttempt}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {log.status === 'Success' ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Success
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Failure
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-gray-500 py-8">No login attempts have been recorded yet.</p>
        )}
      </div>
    </div>
  );
};

export default LoginHistory;
