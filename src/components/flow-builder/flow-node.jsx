
import React, { useState, useRef, useEffect } from "react";
import { Handle, Position } from 'reactflow';
import { Trash2 } from 'lucide-react';
import { StatusBadge } from "./status-badge";

export const CustomNode = ({ id, data, isConnectable, selected, onDelete, onUpdate }) => {
    const labelRef = useRef(null);
    const [isEditing, setIsEditing] = useState(false);

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
        }
    };

    useEffect(() => {
        if (isEditing && labelRef.current) {
            labelRef.current.focus();
        }
    }, [isEditing]);

    console.log(id, data)

    return (
        <div
            className={`bg-white p-4 rounded-lg shadow-md border select-none
                ${selected ? 'ring-2 ring-blue-500' : ''}`}
            onDoubleClick={handleDoubleClick}
        >
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
            />
            
            <div className="flex items-center gap-2 mb-2 drag-handle cursor-grab">
                {isEditing ? (
                    <input
                        ref={labelRef}
                        value={data.label}
                        onChange={(e) => onUpdate(id, { ...data, label: e.target.value })}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={handleKeyDown}
                        className="border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                    />
                ) : (
                    <span className="font-medium">{data.label}</span>
                )}
                {data?.status && <StatusBadge status={data?.status || 'pending'} />}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    className="p-1 hover:bg-red-100 rounded-full"
                >
                    <Trash2 className="w-4 h-4 text-red-500"/>
                </button>
            </div>

            {data.prompt && (
                <div className="mt-1 text-xs text-gray-500 truncate max-w-[200px]">
                    {data.prompt}
                </div>
            )}

            {data.result && (
                <div className={`mt-1 text-xs ${data.error ? 'text-red-500' : 'text-green-500'} truncate max-w-[200px]`}>
                    {data.error || data.result}
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
            />
        </div>
    );
};
