"use client"
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {useWorkflowStatus} from '@/hooks/use-workflow-status';
import { Plus, Trash2, Save, Play } from 'lucide-react';
import {FlowCanvas} from './flow-canvas';
import {WorkflowEngine, NodeStatus} from './flow-runner';
import {NodeConfigPanel, WorkflowPanel, RunPanel} from './flow-panels';

export default function FlowBuilder() {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [nodeCounter, setNodeCounter] = useState(1);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [graphName, setGraphName] = useState('');
    const [savedGraphs, setSavedGraphs] = useState([]);
    const [showConfig, setShowConfig] = useState(false);
    const [currentRun, setCurrentRun] = useState(null);
    const [runs, setRuns] = useState([]);
    const [isExecuting, setIsExecuting] = useState(false);
    const [activePanel, setActivePanel] = useState('workflow'); // 'workflow', 'run', 'node', or null
    const [serverRunId, setServerRunId] = useState(null);

    const { run: serverRun } = useWorkflowStatus(serverRunId, {
        onComplete: (run) => {
            setCurrentRun(run);
            setRuns(prev => prev.map(r =>
                r.runId === run.runId ? run : r
            ));
            setServerRunId(null);
        },
        onError: (error) => {
            console.error('Workflow execution failed:', error);
            setServerRunId(null);
        }
    });


    useEffect(() => {
        if (serverRun) {
            setCurrentRun(serverRun);
            setRuns(prev => prev.map(run =>
                run.runId === serverRun.runId ? serverRun : run
            ));
        }
    }, [serverRun]);

    // Load saved graphs and runs on mount
    useEffect(() => {
        const graphs = Object.keys(localStorage).filter(key => key.startsWith('flow-'));
        setSavedGraphs(graphs.map(key => key.replace('flow-', '')));
    }, []);

    // Load runs for current graph
    useEffect(() => {
        if (graphName) {
            const savedRuns = Object.keys(localStorage)
                .filter(key => key.startsWith(`run-${graphName}-`))
                .map(key => JSON.parse(localStorage.getItem(key)))
                .sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            setRuns(savedRuns);
        } else {
            setRuns([]);
        }
    }, [graphName]);

    const addNode = useCallback(() => {
        const newNode = {
            id: `node-${nodeCounter}`,
            position: {
                x: 150 + (nodeCounter % 3) * 150,
                y: 100 + Math.floor(nodeCounter / 3) * 100
            },
            data: {
                label: `Node ${nodeCounter}`,
                prompt: ''
            }
        };

        setNodes(prevNodes => [...prevNodes, newNode]);

        if (selectedNodeId) {
            const newEdge = {
                id: `edge-${selectedNodeId}-${newNode.id}`,
                source: selectedNodeId,
                target: newNode.id
            };
            setEdges(prevEdges => [...prevEdges, newEdge]);
        } else if (nodes.length > 0) {
            const lastNode = nodes[nodes.length - 1];
            const newEdge = {
                id: `edge-${lastNode.id}-${newNode.id}`,
                source: lastNode.id,
                target: newNode.id
            };
            setEdges(prevEdges => [...prevEdges, newEdge]);
        }

        setNodeCounter(prev => prev + 1);
    }, [nodes, nodeCounter, selectedNodeId]);

    const deleteWorkflow = () => {
        if (!graphName) return;

        // Delete workflow from localStorage
        localStorage.removeItem(`flow-${graphName}`);

        // Delete all associated runs
        runs.forEach(run => {
            localStorage.removeItem(run.runId);
        });

        // Update state
        setSavedGraphs(prev => prev.filter(name => name !== graphName));
        setRuns([]);
        clearGraph();
    };

    const deleteRun = async (runId) => {
        try {

            // Remove from localStorage (for local runs)
            localStorage.removeItem(runId);

            // If this was a server run, delete it from the server first
            if (runId.startsWith('run-')) {  // All server runs have this prefix
                const response = await fetch(`/api/workflow/run/${runId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) {
                    console.log('Failed to delete run from server');
                }
            }



            // Update state
            setRuns(prev => prev.filter(run => run.runId !== runId));

            // If this was the current run, clear it
            if (currentRun?.runId === runId) {
                setCurrentRun(null);
                setActivePanel(null);
            }
        } catch (error) {
            console.error('Error deleting run:', error);
            // You might want to show an error notification to the user here
        }
    };

    const deleteNode = useCallback((nodeId) => {
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
            setShowConfig(false);
        }
        setNodes(prevNodes => prevNodes.filter(node => node.id !== nodeId));
        setEdges(prevEdges => prevEdges.filter(edge =>
            edge.source !== nodeId && edge.target !== nodeId
        ));
    }, [selectedNodeId]);

    const updateNodePosition = useCallback((nodeId, position) => {
        setNodes(prevNodes => prevNodes.map(node =>
            node.id === nodeId ? { ...node, position } : node
        ));
    }, []);

    const updateNodeData = useCallback((nodeId, newData) => {
        setNodes(prevNodes => prevNodes.map(node =>
            node.id === nodeId ? { ...node, data: newData } : node
        ));
    }, []);

    const getNodeWithRunDetails = (nodeId) => {
        if (!currentRun) return nodes.find(n => n.id === nodeId);

        const workflowNode = nodes.find(n => n.id === nodeId);
        const runNode = currentRun.nodes.find(n => n.id === nodeId);

        if (!workflowNode) return null;
        if (!runNode) return workflowNode;

        return {
            ...workflowNode,
            status: runNode.status,
            startTime: runNode.startTime,
            endTime: runNode.endTime,
            result: runNode.result,
            error: runNode.error
        };
    };

    const saveGraph = () => {
        if (!graphName.trim()) return;

        const graphData = {
            nodes,
            edges,
            nodeCounter
        };

        localStorage.setItem(`flow-${graphName}`, JSON.stringify(graphData));

        if (!savedGraphs.includes(graphName)) {
            setSavedGraphs([...savedGraphs, graphName]);
        }
    };

    const loadGraph = (name) => {
        const graphData = localStorage.getItem(`flow-${name}`);
        if (graphData) {
            const { nodes: loadedNodes, edges: loadedEdges, nodeCounter: loadedCounter } = JSON.parse(graphData);
            setNodes(loadedNodes);
            setEdges(loadedEdges);
            setNodeCounter(loadedCounter);
            setSelectedNodeId(null);
            setShowConfig(false);
            setGraphName(name);
            setCurrentRun(null);
        }
    };

    const loadRun = (runId) => {
        const run = runs.find(r => r.runId === runId);
        if (run) {
            setCurrentRun(run);
        }
    };

    const clearGraph = () => {
        setNodes([]);
        setEdges([]);
        setNodeCounter(1);
        setSelectedNodeId(null);
        setShowConfig(false);
        setGraphName('');
        setCurrentRun(null);
    };

    const executeWorkflow = async () => {
        if (!graphName || isExecuting) return;

        setIsExecuting(true);
        const runId = `run-${graphName}-${Date.now()}`;  // Make run ID unique with timestamp and graph name
        const runArtifact = {
            ...WorkflowEngine.createRunArtifact({ nodes, edges, nodeCounter }),
            runId // Override the runId
        };
        setCurrentRun(runArtifact);

        const rootNodes = WorkflowEngine.getRootNodes(runArtifact);
        const executedNodes = new Set();

        const executeNode = async (node) => {
            if (executedNodes.has(node.id)) return;

            // Wait for parents to complete
            const parents = WorkflowEngine.getNodeParents(runArtifact, node.id);
            await Promise.all(parents.map(parent => executeNode(parent)));

            // Check if all parents succeeded
            const parentsFailed = parents.some(parent => {
                const parentNode = runArtifact.nodes.find(n => n.id === parent.id);
                return parentNode.status === NodeStatus.FAILED;
            });

            if (parentsFailed) {
                setCurrentRun(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n =>
                        n.id === node.id
                            ? {
                                ...n,
                                status: NodeStatus.FAILED,
                                error: 'Parent node(s) failed',
                                endTime: new Date().toISOString()
                            }
                            : n
                    )
                }));
                return;
            }

            // Update node status to running
            setCurrentRun(prev => ({
                ...prev,
                nodes: prev.nodes.map(n =>
                    n.id === node.id
                        ? { ...n, status: NodeStatus.RUNNING, startTime: new Date().toISOString() }
                        : n
                )
            }));

            try {
                const result = await WorkflowEngine.executeNode(node, runArtifact);
                executedNodes.add(node.id);

                setCurrentRun(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n =>
                        n.id === node.id
                            ? {
                                ...n,
                                status: result.success ? NodeStatus.SUCCESS : NodeStatus.FAILED,
                                result: result.result,
                                error: result.error,
                                endTime: new Date().toISOString()
                            }
                            : n
                    )
                }));

                if (result.success) {
                    // Execute children
                    const children = WorkflowEngine.getNodeChildren(runArtifact, node.id);
                    await Promise.all(children.map(child => executeNode(child)));
                }
            } catch (error) {
                setCurrentRun(prev => ({
                    ...prev,
                    nodes: prev.nodes.map(n =>
                        n.id === node.id
                            ? {
                                ...n,
                                status: NodeStatus.FAILED,
                                error: error.message,
                                endTime: new Date().toISOString()
                            }
                            : n
                    )
                }));
            }
        };

        try {
            await Promise.all(rootNodes.map(node => executeNode(node)));
        } finally {
            setIsExecuting(false);

            // Save run artifact
            if (currentRun) {
                const runKey = `run-${graphName}-${runArtifact.runId}`;
                localStorage.setItem(runKey, JSON.stringify(currentRun));
                setRuns(prev => [currentRun, ...prev]);
            }
        }
    };

    const selectedNode = selectedNodeId ? getNodeWithRunDetails(selectedNodeId) : null;
    const displayedNodes = currentRun?.nodes || nodes;

    const handleCanvasClick = () => {
        setSelectedNodeId(null);
        setShowConfig(false);
    };

    const executeWorkflowOnServer = async () => {
        if (!graphName || isExecuting) return;

        try {
            // Create optimistic run state
            const optimisticRun = {
                runId: `run-${Date.now()}`,
                startTime: new Date().toISOString(),
                status: 'running',
                nodes: nodes.map(node => ({
                    ...node,
                    status: 'pending',
                    startTime: null,
                    endTime: null,
                    result: null,
                    error: null
                })),
                edges: edges
            };

            // Update UI immediately
            setCurrentRun(optimisticRun);
            setRuns(prev => [optimisticRun, ...prev]);

            // Start actual execution
            const response = await fetch('/api/workflow/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nodes, edges })
            });

            if (!response.ok) {
                throw new Error('Failed to execute workflow');
            }

            const initialRun = await response.json();
            // Update with server-generated runId
            setCurrentRun(prev => ({
                ...prev,
                runId: initialRun.runId
            }));
            setRuns(prev => prev.map(run =>
                run.runId === optimisticRun.runId
                    ? { ...run, runId: initialRun.runId }
                    : run
            ));

            // Start polling with new runId
            setServerRunId(initialRun.runId);

        } catch (error) {
            console.error('Failed to start workflow:', error);
            // Revert optimistic updates on error
            setCurrentRun(null);
            setRuns(prev => prev.filter(run => run.runId !== optimisticRun.runId));
        }
    };

    const handleServerExecute = async () => {
        try {
            const result = await executeWorkflowOnServer({ nodes, edges });
            result && setServerRunId(result.runId);
        } catch (error) {
            console.error('Failed to start workflow:', error);
        }
    };

    const handleRunSelect = (runId) => {
        const selectedRun = runs.find(r => r.runId === runId);
        if (selectedRun) {
            setCurrentRun(selectedRun);
            // If run is still in progress, start polling
            console.log('load run', selectedRun.runId);
            if (selectedRun.status === 'running') {
                setServerRunId(selectedRun.runId);
            } else {
                setServerRunId(null);
            }
        }
    };

    return (
        <div className="relative">
            <Card className="p-6">
                <div className="space-y-4">
                    <div className="flex gap-4 items-center">
                        <Button
                            onClick={addNode}
                            className="flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Add Node
                        </Button>

                        <div className="flex-1 flex gap-4 items-center">
                            <Input
                                placeholder="Graph name"
                                value={graphName}
                                onChange={(e) => setGraphName(e.target.value)}
                                className="max-w-[200px]"
                            />
                            <Button
                                onClick={saveGraph}
                                variant="outline"
                                className="flex items-center gap-2"
                                disabled={!graphName.trim()}
                            >
                                <Save className="w-4 h-4" />
                                Save
                            </Button>

                            {savedGraphs.length > 0 && (
                                <Select
                                    value={graphName}
                                    onValueChange={loadGraph}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Load graph..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {savedGraphs.map(name => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {graphName && !serverRunId && (
                                <Button
                                    onClick={executeWorkflow}
                                    className="flex items-center gap-2"
                                    disabled={isExecuting || !nodes.length}
                                >
                                    <Play className="w-4 h-4" />
                                    {isExecuting ? 'Running...' : 'Run Workflow'}
                                </Button>
                            )}

                            {graphName && !serverRunId && (
                                <Button
                                    onClick={handleServerExecute}
                                    disabled={!graphName || !nodes.length}
                                    className="flex items-center gap-2"
                                >
                                    {serverRunId ? 'Running on server...' : 'Run on Server'}
                                </Button>
                            )}

                            {runs.length > 0 && (
                                <Select
                                    value={currentRun?.runId || ''}
                                    onValueChange={handleRunSelect}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="View run..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {runs.map(run => (
                                            <SelectItem key={run.runId} value={run.runId}>
                                                {new Date(run.startTime).toLocaleString()}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {!!nodes.length && (
                                <Button
                                    onClick={clearGraph}
                                    variant="ghost"
                                    className="flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear
                                </Button>
                            )}

                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setActivePanel('workflow')}
                            className="ml-auto"
                        >
                            Workflow Details
                        </Button>
                        {currentRun && (
                            <Button
                                variant="outline"
                                onClick={() => setActivePanel('run')}
                            >
                                Run Details
                            </Button>
                        )}
                    </div>

                    {selectedNodeId && (
                        <div className="text-sm text-gray-500">
                            Selected: Node {selectedNodeId.split('-')[1]}
                        </div>
                    )}

                    <FlowCanvas
                        nodes={displayedNodes}
                        edges={edges}
                        onDeleteNode={deleteNode}
                        onUpdateNodePosition={updateNodePosition}
                        selectedNodeId={selectedNodeId}
                        onSelectNode={(id) => {
                            setSelectedNodeId(id);
                            setActivePanel('node');
                        }}
                        onUpdateNode={updateNodeData}
                        onClick={() => {
                            setSelectedNodeId(null);
                            setActivePanel(null);
                        }}
                    />
                </div>
            </Card>

            {activePanel === 'workflow' && (
                <WorkflowPanel
                    workflow={{ nodes, edges }}
                    graphName={graphName}
                    onClose={() => setActivePanel(null)}
                    onDelete={deleteWorkflow}
                />
            )}

            {activePanel === 'run' && currentRun && (
                <RunPanel
                    run={currentRun}
                    graphName={graphName}
                    onClose={() => setActivePanel(null)}
                    onDelete={() => deleteRun(currentRun.runId)}
                />
            )}

            {activePanel === 'node' && selectedNode && (
                <NodeConfigPanel
                    node={selectedNode}
                    onUpdate={updateNodeData}
                    onClose={() => setActivePanel(null)}
                    isRunView={!!currentRun}
                />
            )}
        </div>
    );
};