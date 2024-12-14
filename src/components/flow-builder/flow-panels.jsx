import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Trash2 } from 'lucide-react';
import { StatusBadge } from './status-badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Base Panel Component with delete button option
const Panel = ({ title, children, onClose, onDelete, className = '' }) => (
    <Card className={`fixed right-0 top-0 h-full w-96 shadow-lg border-l bg-white ${className}`}>
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">{title}</h3>
                <div className="flex items-center gap-2">
                    {onDelete && (
                        <Button variant="ghost" size="icon" onClick={onDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4"/>
                </Button>
            </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-4">
                    {children}
                </div>
            </ScrollArea>
        </div>
    </Card>
);

// Delete Confirmation Dialog
const DeleteConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    description
}) => (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>{title}</AlertDialogTitle>
                <AlertDialogDescription>{description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                    onClick={onConfirm}
                    className="bg-red-600 hover:bg-red-700"
                >
                    Delete
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
);

export const NodeConfigPanel = ({ node, onUpdate, onClose, isRunView = false }) => {
    const renderExecutionDetails = () => {
        if (!node.status) return null;

        const duration = node.startTime && node.endTime
            ? ((new Date(node.endTime) - new Date(node.startTime)) / 1000).toFixed(1)
            : null;

        return (
            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Execution Details</h4>
                <div className="grid gap-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">Status</span>
                            <StatusBadge status={node.status} />
                        </div>
                        {duration && (
                            <div className="text-xs text-gray-500 mt-1">
                                Duration: {duration}s
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                        <div className="space-y-1">
                            <div className="text-sm text-gray-600">Started</div>
                            <div className="text-sm">
                                {node.startTime
                                    ? new Date(node.startTime).toLocaleString()
                                    : 'Not started'}
                            </div>
                        </div>
                        {node.endTime && (
                            <div className="space-y-1">
                                <div className="text-sm text-gray-600">Completed</div>
                                <div className="text-sm">
                                    {new Date(node.endTime).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>

                    {node.error && (
                        <div className="bg-red-50 p-3 rounded-lg space-y-1">
                            <div className="text-sm font-medium text-red-800">Error</div>
                            <div className="text-sm text-red-700">{node.error}</div>
                        </div>
                    )}

                    {node.result && (
                        <div className="bg-green-50 p-3 rounded-lg space-y-1">
                            <div className="text-sm font-medium text-green-800">Result</div>
                            <div className="text-sm text-green-700 whitespace-pre-wrap">
                                {node.result}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderConfiguration = () => (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-medium mb-1 block">Node Label</label>
                <input
                    type="text"
                    value={node.data.label}
                    onChange={(e) => onUpdate(node.id, {
                        ...node.data,
                        label: e.target.value
                    })}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isRunView}
                />
            </div>
            <div>
                <label className="text-sm font-medium mb-1 block">Prompt Template</label>
                <textarea
                    value={node.data.prompt || ''}
                    onChange={(e) => onUpdate(node.id, {
                        ...node.data,
                        prompt: e.target.value
                    })}
                    placeholder="Enter your prompt template here..."
                    className="w-full px-3 py-2 border rounded-md min-h-[200px]"
                    disabled={isRunView}
                />
            </div>
        </div>
    );

    return (
        <Panel
            title={isRunView ? "Node Details" : "Node Configuration"}
            onClose={onClose}
            className="z-30"
        >
            {isRunView
                ? (
                    <>
                        {renderExecutionDetails()}
                        <div className="mt-6 pt-6 border-t">
                            <h4 className="font-medium mb-4">Node Configuration</h4>
                            {renderConfiguration()}
                        </div>
                    </>
                )
                : (
                    <>
                        {renderConfiguration()}
                        {node.status && renderExecutionDetails()}
                    </>
                )}
        </Panel>
    );
};

// Workflow Summary Panel
export const WorkflowPanel = ({ workflow, graphName, onClose, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

    return (
        <>
    <Panel
        title="Workflow Details"
        onClose={onClose}
        onDelete={() => setShowDeleteConfirm(true)}
        className="z-20"
    >
        <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Workflow Name</div>
                        <div className="text-lg font-semibold">{graphName}</div>
                    </div>

            <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Total Nodes</div>
                    <div className="text-2xl font-semibold">{workflow.nodes.length}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600">Connections</div>
                    <div className="text-2xl font-semibold">{workflow.edges.length}</div>
                </div>
            </div>

            <div className="space-y-2">
                <h4 className="font-medium">Nodes</h4>
                <div className="space-y-2">
                    {workflow.nodes.map(node => (
                        <div key={`workflow-node-${node.id}`} className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-sm">{node.data.label}</div>
                            {node.data.prompt && (
                                <div className="text-gray-600 text-xs mt-1 truncate">
                                    {node.data.prompt}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </Panel>

            <DeleteConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                }}
                title="Delete Workflow"
                description={`Are you sure you want to delete the workflow "${graphName}"? This action cannot be undone.`}
            />
        </>
    );
};

// RunPanel with delete functionality
export const RunPanel = ({ run, graphName, onClose, onDelete }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
    const completedNodes = run.nodes.filter(n => n.status === 'success' || n.status === 'failed').length;
    const duration = run.nodes.reduce((acc, node) => {
        if (node.startTime && node.endTime) {
            return acc + (new Date(node.endTime) - new Date(node.startTime));
        }
        return acc;
    }, 0);

    return (
        <>
        <Panel
            title="Run Details"
            onClose={onClose}
                onDelete={() => setShowDeleteConfirm(true)}
            className="z-10"
        >
            <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Run Time</div>
                        <div className="font-semibold">
                            {new Date(run.startTime).toLocaleString()}
                        </div>
                    </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Progress</div>
                        <div className="text-2xl font-semibold">
                            {completedNodes}/{run.nodes.length}
                        </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="text-sm text-gray-600">Duration</div>
                        <div className="text-2xl font-semibold">
                            {(duration / 1000).toFixed(1)}s
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <h4 className="font-medium">Node Status</h4>
                    <div className="space-y-2">
                        {run.nodes.map(node => (
                            <div key={`run-node-${node.id}-${run.runId}`} className="bg-gray-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium text-sm">{node.data.label}</span>
                                    <StatusBadge status={node.status} />
                                </div>
                                {node.error && (
                                    <div className="text-red-600 text-xs mt-1">{node.error}</div>
                                )}
                                {node.result && (
                                    <div className="text-green-600 text-xs mt-1">{node.result}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Panel>

            <DeleteConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    onDelete();
                    setShowDeleteConfirm(false);
                }}
                title="Delete Run"
                description={`Are you sure you want to delete this run from ${new Date(run.startTime).toLocaleString()}? This action cannot be undone.`}
            />
        </>
    );
};