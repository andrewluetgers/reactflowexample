import React from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CustomNode } from './flow-node';

const nodeTypes = {
    custom: CustomNode,
};

export const FlowCanvas = ({
    nodes,
    edges,
    onDeleteNode,
    onUpdateNodePosition,
    selectedNodeId,
    onSelectNode,
    onUpdateNode,
}) => {
    const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(
        nodes.map(node => ({
            ...node,
            type: 'custom',
            dragHandle: '.drag-handle',
        }))
    );
    const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(edges);

    React.useEffect(() => {
        setNodes(
            nodes.map(node => ({
                ...node,
                type: 'custom',
                dragHandle: '.drag-handle',
                selected: node.id === selectedNodeId,
                data: {
                    ...node.data,
                    status: node.status // Ensure status is copied to data
                }
            }))
        );
    }, [nodes, selectedNodeId, setNodes]);

    React.useEffect(() => {
        setEdges(edges);
    }, [edges, setEdges]);

    const onNodeDragStop = (_, node) => {
        onUpdateNodePosition(node.id, node.position);
    };

    return (
        <div className="border rounded-lg bg-slate-50 h-[500px]">
            <ReactFlow
                nodes={reactFlowNodes}
                edges={reactFlowEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStop={onNodeDragStop}
                onNodeClick={(_, node) => onSelectNode(node.id)}
                nodeTypes={nodeTypes}
                fitView
            >
                <Background />
                <Controls />
                <MiniMap />
            </ReactFlow>
        </div>
    );
};
