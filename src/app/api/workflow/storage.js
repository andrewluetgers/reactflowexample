const runStore = new Map();

export const RunStorage = {
    createRun: (runId, workflow) => {
        const run = {
            runId,
            startTime: new Date().toISOString(),
            status: 'running',
            nodes: workflow.nodes.map(node => ({
                ...node,
                status: 'pending',
                startTime: null,
                endTime: null,
                result: null,
                error: null
            })),
            edges: workflow.edges
        };
        runStore.set(runId, run);
        return run;
    },

    deleteRun: (runId) => {
        // console.log('deleting run', runId)
        // console.log(runStore)
        return runStore.delete(runId);
    },

    updateNode: (runId, nodeId, update) => {
        const run = runStore.get(runId);
        if (!run) return null;

        run.nodes = run.nodes.map(node =>
            node.id === nodeId ? { ...node, ...update } : node
        );
        return run;
    },

    updateRun: (runId, update) => {
        const run = runStore.get(runId);
        if (!run) return null;

        const updatedRun = {
            ...run,
            ...update
        };
        runStore.set(runId, updatedRun);
        return updatedRun;
    },

    getRun: (runId) => {
        // console.log('getting run', runId)
        // console.log(runStore.entries())
        return runStore.get(runId)
    },

    // Clean up old runs (call this periodically)
    cleanup: () => {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        for (const [runId, run] of runStore.entries()) {
            if (new Date(run.startTime) < oneHourAgo) {
                runStore.delete(runId);
            }
        }
    }
};