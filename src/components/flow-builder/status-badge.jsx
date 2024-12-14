import React from "react";
import {NodeStatus} from "./flow-runner";

export const StatusBadge = ({ status }) => {
    const colors = {
        [NodeStatus.PENDING]: 'bg-gray-100 text-gray-800',
        [NodeStatus.RUNNING]: 'bg-blue-100 text-blue-800 animate-pulse',
        [NodeStatus.SUCCESS]: 'bg-green-100 text-green-800',
        [NodeStatus.FAILED]: 'bg-red-100 text-red-800'
    };

    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
      {status}
    </span>
    );
};
