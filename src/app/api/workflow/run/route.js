// app/api/workflow/run/route.js
import { NextResponse } from 'next/server';
import { RunStorage } from '../storage';

const NodeStatus = {
    PENDING: 'pending',
    RUNNING: 'running',
    SUCCESS: 'success',
    FAILED: 'failed'
};

class WorkflowRunner {
    static getNodeChildren(workflow, nodeId) {
        return workflow.edges
            .filter(edge => edge.source === nodeId)
            .map(edge => workflow.nodes.find(node => node.id === edge.target))
            .filter(Boolean);
    }

    static getNodeParents(workflow, nodeId) {
        return workflow.edges
            .filter(edge => edge.target === nodeId)
            .map(edge => workflow.nodes.find(node => node.id === edge.source))
            .filter(Boolean);
    }

    static getRootNodes(workflow) {
        const targetNodeIds = new Set(workflow.edges.map(edge => edge.target));
        return workflow.nodes.filter(node => !targetNodeIds.has(node.id));
    }

    static async executeNode(node, runId, parentResults = {}) {
        RunStorage.updateNode(runId, node.id, {
            status: NodeStatus.RUNNING,
            startTime: new Date().toISOString()
        });

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 2000));

        try {
            const prompt = node.data.prompt;
            if (!prompt) {
                const result = {
                    status: NodeStatus.SUCCESS,
                    result: "Node executed without prompt",
                    endTime: new Date().toISOString()
                };
                RunStorage.updateNode(runId, node.id, result);
                return { success: true, ...result };
            }

            // Process prompt with parent results
            let processedPrompt = prompt;
            Object.entries(parentResults).forEach(([nodeId, result]) => {
                processedPrompt = processedPrompt.replace(`{{${nodeId}}}`, result.result || '');
            });

            if (Math.random() < 0.1) { // 10% chance of failure
                throw new Error('Random execution failure');
            }

            const result = {
                status: NodeStatus.SUCCESS,
                result: `Processed: ${processedPrompt}`,
                endTime: new Date().toISOString()
            };
            RunStorage.updateNode(runId, node.id, result);
            return { success: true, ...result };
        } catch (error) {
            const result = {
                status: NodeStatus.FAILED,
                error: error.message,
                endTime: new Date().toISOString()
            };
            RunStorage.updateNode(runId, node.id, result);
            return { success: false, ...result };
        }
    }

    static async executeWorkflowAsync(workflow, runId) {
        const executedNodes = new Set();
        const results = {};

        async function executeNodeWithDependencies(nodeId) {
            if (executedNodes.has(nodeId)) {
                return results[nodeId];
            }

            const node = workflow.nodes.find(n => n.id === nodeId);
            if (!node) throw new Error(`Node ${nodeId} not found`);

            // Execute parents first
            const parents = WorkflowRunner.getNodeParents(workflow, nodeId);
            const parentResults = {};

            for (const parent of parents) {
                const parentResult = await executeNodeWithDependencies(parent.id);
                if (!parentResult.success) {
                    const result = {
                        status: NodeStatus.FAILED,
                        error: `Parent node ${parent.id} failed`,
                        endTime: new Date().toISOString()
                    };
                    RunStorage.updateNode(runId, nodeId, result);
                    results[nodeId] = { success: false, ...result };
                    executedNodes.add(nodeId);
                    return results[nodeId];
                }
                parentResults[parent.id] = parentResult;
            }

            // Execute current node
            const result = await WorkflowRunner.executeNode(node, runId, parentResults);
            results[nodeId] = result;
            executedNodes.add(nodeId);

            // Process children after successful execution
            if (result.success) {
                const children = WorkflowRunner.getNodeChildren(workflow, nodeId);
                await Promise.all(children.map(child => executeNodeWithDependencies(child.id)));
            }

            return result;
        }

        try {
            const rootNodes = this.getRootNodes(workflow);
            await Promise.all(rootNodes.map(node => executeNodeWithDependencies(node.id)));

            // Verify all nodes were executed
            if (executedNodes.size === workflow.nodes.length) {
                RunStorage.updateRun(runId, {
                    status: 'completed',
                    endTime: new Date().toISOString()
                });
            } else {
                throw new Error('Not all nodes were executed');
            }
        } catch (error) {
            RunStorage.updateRun(runId, {
                status: 'failed',
                error: error.message,
                endTime: new Date().toISOString()
            });
            throw error;
        }
    }

    static async execute(workflow) {
        const runId = `run-${Date.now()}`;
        const run = RunStorage.createRun(runId, workflow);

        this.executeWorkflowAsync(workflow, runId).catch(error => {
            console.error('Workflow execution failed:', error);
            RunStorage.updateRun(runId, {
                status: 'failed',
                error: error.message,
                endTime: new Date().toISOString()
            });
        });

        return run;
    }
}

export async function POST(request) {
    try {
        const workflow = await request.json();

        if (!workflow.nodes || !workflow.edges) {
            return NextResponse.json(
                { error: "Invalid workflow format" },
                { status: 400 }
            );
        }

        const run = await WorkflowRunner.execute(workflow);
        return NextResponse.json(run);

    } catch (error) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}