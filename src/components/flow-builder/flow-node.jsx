
// Modified FlowNode component to show status and result
import React, {useEffect, useRef, useState} from "react";
import { Trash2 } from 'lucide-react';
import { StatusBadge } from "./status-badge";

export const FlowNode = ({
    id,
    position,
    data,
    onDelete,
    onDragStart,
    onDrag,
    onDragEnd,
    transform,
    isSelected,
    onSelect,
    onUpdate,
    status,
    result,
    error
}) => {
    const nodeRef = useRef(null);
    const labelRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const dragStartPos = useRef({x: 0, y: 0});
    const nodeStartPos = useRef({x: 0, y: 0});

    const handleMouseDown = (e) => {
        e.stopPropagation();
        if (e.button === 0) {
            setIsDragging(true);
            dragStartPos.current = {
                x: e.clientX,
                y: e.clientY
            };
            nodeStartPos.current = {
                x: position.x,
                y: position.y
            };
            onDragStart(id);
            onSelect(id);
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const dx = (e.clientX - dragStartPos.current.x) / transform.scale;
        const dy = (e.clientY - dragStartPos.current.y) / transform.scale;

        const newX = nodeStartPos.current.x + dx;
        const newY = nodeStartPos.current.y + dy;

        onDrag(id, {x: newX, y: newY});
    };

    const handleMouseUp = () => {
        if (isDragging) {
            setIsDragging(false);
            onDragEnd(id);
        }
    };

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
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging]);

    useEffect(() => {
        if (isEditing && labelRef.current) {
            labelRef.current.focus();
        }
    }, [isEditing]);

    return (
        <div
            ref={nodeRef}
            className={`absolute bg-white p-4 rounded-lg shadow-md border select-none
        ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: 'translate(-50%, -50%)',
                zIndex: isDragging ? 1000 : 1
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
        >
            <div className="flex items-center gap-2 mb-2">
                {isEditing ? (
                    <input
                        ref={labelRef}
                        value={data.label}
                        onChange={(e) => onUpdate(id, {...data, label: e.target.value})}
                        onBlur={() => setIsEditing(false)}
                        onKeyDown={handleKeyDown}
                        className="border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        autoFocus
                    />
                ) : (
                    <span className="font-medium">{data.label}</span>
                )}
                {status && <StatusBadge status={status} />}
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

            {result && (
                <div className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-green-500'} truncate max-w-[200px]`}>
                    {error || result}
                </div>
            )}
        </div>
    );
};