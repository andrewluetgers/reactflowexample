import React from "react";


export const WorkflowEngine = {
    getNodeChildren: (workflow, nodeId) => {
        return workflow.edges
            .filter(edge => edge.source === nodeId)
            .map(edge => workflow.nodes.find(node => node.id === edge.target));
    },

    getNodeParents: (workflow, nodeId) => {
        return workflow.edges
            .filter(edge => edge.target === nodeId)
            .map(edge => workflow.nodes.find(node => node.id === edge.source));
    },

    getRootNodes: (workflow) => {
        const targetNodeIds = new Set(workflow.edges.map(edge => edge.target));
        return workflow.nodes.filter(node => !targetNodeIds.has(node.id));
    },

    // Mock execution function
    executeNode: async (node, workflow) => {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        const success = Math.random() > 0.2; // 80% success rate
        return {
            success,
            result: success ? `Processed ${node.data.prompt || 'no prompt'}` : 'Failed to process',
            error: success ? null : 'Random failure'
        };
    },

    createRunArtifact: (workflow) => {
        return {
            ...workflow,
            runId: `run----${Date.now()}`,
            startTime: new Date().toISOString(),
            nodes: workflow.nodes.map(node => ({
                ...node,
                status: 'pending',
                result: null,
                error: null,
                startTime: null,
                endTime: null
            }))
        };
    }
};

export const NodeStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed'
};