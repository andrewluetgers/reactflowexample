import React, {useEffect, useRef, useState} from "react";
import {FlowNode} from "./flow-node";

export const FlowCanvas = ({
    nodes,
    edges,
    onDeleteNode,
    onUpdateNodePosition,
    selectedNodeId,
    onSelectNode,
    onUpdateNode
}) => {
    const canvasRef = useRef(null);
    const [transform, setTransform] = useState({x: 0, y: 0, scale: 1});
    const [isPanning, setIsPanning] = useState(false);
    const lastMousePos = useRef({x: 0, y: 0});

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY;
        const scaleChange = delta > 0 ? 0.9 : 1.1;
        const newScale = Math.min(Math.max(transform.scale * scaleChange, 0.1), 2);

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setTransform(prev => {
            const scaleDiff = newScale - prev.scale;
            return {
                scale: newScale,
                x: prev.x - (mouseX - prev.x) * (scaleDiff / prev.scale),
                y: prev.y - (mouseY - prev.y) * (scaleDiff / prev.scale)
            };
        });
    };

    const handleCanvasMouseDown = (e) => {
        if (e.button === 0) {
            onSelectNode(null);
        }
        if (e.button === 0 || e.button === 2) {
            setIsPanning(true);
            lastMousePos.current = {x: e.clientX, y: e.clientY};
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (isPanning) {
            const dx = e.clientX - lastMousePos.current.x;
            const dy = e.clientY - lastMousePos.current.y;

            setTransform(prev => ({
                ...prev,
                x: prev.x + dx,
                y: prev.y + dy
            }));

            lastMousePos.current = {x: e.clientX, y: e.clientY};
        }
    };

    const handleCanvasMouseUp = () => {
        setIsPanning(false);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.addEventListener('wheel', handleWheel, {passive: false});
        return () => canvas.removeEventListener('wheel', handleWheel);
    }, [transform]);

    return (
        <div
            ref={canvasRef}
            className="border rounded-lg bg-slate-50 h-[500px] relative overflow-hidden"
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onContextMenu={(e) => e.preventDefault()}
        >
            <div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0'
                }}
            >
                {edges.map((edge) => {
                    const startNode = nodes.find(n => n.id === edge.source);
                    const endNode = nodes.find(n => n.id === edge.target);

                    if (!startNode || !endNode) return null;

                    return (
                        <svg
                            key={`${edge.source}-${edge.target}`}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{zIndex: 0}}
                        >
                            <line
                                x1={startNode.position.x}
                                y1={startNode.position.y}
                                x2={endNode.position.x}
                                y2={endNode.position.y}
                                stroke="#999"
                                strokeWidth={2 / transform.scale}
                                markerEnd="url(#arrowhead)"
                            />
                        </svg>
                    );
                })}

                <svg className="absolute" width="0" height="0">
                    <defs>
                        <marker
                            id="arrowhead"
                            markerWidth="10"
                            markerHeight="7"
                            refX="9"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill="#999"/>
                        </marker>
                    </defs>
                </svg>

                {nodes.map((node) => (
                    <FlowNode
                        key={node.id}
                        {...node}
                        onDelete={onDeleteNode}
                        onDragStart={() => {
                        }}
                        onDrag={(id, pos) => onUpdateNodePosition(id, pos)}
                        onDragEnd={() => {
                        }}
                        transform={transform}
                        isSelected={node.id === selectedNodeId}
                        onSelect={onSelectNode}
                        onUpdate={onUpdateNode}
                    />
                ))}
            </div>
        </div>
    );
};
