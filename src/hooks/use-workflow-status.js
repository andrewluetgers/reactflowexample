import { useState, useEffect, useRef } from 'react';

export const useWorkflowStatus = (runId, options = {}) => {
    const {
        initialPollingInterval = 1000,
        maxPollingInterval = 5000,
        pollingBackoff = 1.5,
        onComplete,
        onError
    } = options;

    const [run, setRun] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentInterval, setCurrentInterval] = useState(initialPollingInterval);
    const timeoutId = useRef(null);

    useEffect(() => {
        if (!runId) {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const fetchStatus = async () => {
            try {
                const response = await fetch(`/api/workflow/status/${runId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch workflow status');
                }

                const data = await response.json();

                if (!isMounted) return;

                setRun(data);
                setError(null);

                if (data.status === 'completed') {
                    onComplete?.(data);
                } else if (data.status === 'failed') {
                    onError?.(new Error(data.error || 'Workflow failed'));
                } else {
                    const nextInterval = Math.min(
                        currentInterval * pollingBackoff,
                        maxPollingInterval
                    );
                    setCurrentInterval(nextInterval);
                    timeoutId.current = setTimeout(fetchStatus, nextInterval);
                }
            } catch (err) {
                if (!isMounted) return;
                setError(err);
                onError?.(err);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        timeoutId.current = setTimeout(fetchStatus, 500);

        return () => {
            isMounted = false;
            if (timeoutId.current) {
                clearTimeout(timeoutId.current);
            }
        };
    }, [runId]);

    // Reset interval when runId changes
    useEffect(() => {
        setCurrentInterval(initialPollingInterval);
    }, [runId, initialPollingInterval]);

    return {
        run,
        error,
        isLoading,
        isComplete: run?.status === 'completed',
        isFailed: run?.status === 'failed'
    };
};