import React from "react";
export const StatusBadge = ({ status }) => {
    const colors = {
        'pending': 'bg-gray-100 text-gray-800',
        'running': 'bg-blue-100 text-blue-800 animate-pulse',
        'success': 'bg-green-100 text-green-800',
        'failed': 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
    );
};
