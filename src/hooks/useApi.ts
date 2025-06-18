import { useState, useEffect } from 'react';

interface UseApiState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
    refetch: () => Promise<void>;
}

export function useApi<T>(
    apiCall: () => Promise<T>,
    immediate: boolean = true
): UseApiReturn<T> {
    const [state, setState] = useState<UseApiState<T>>({
        data: null,
        loading: immediate,
        error: null,
    });

    const fetchData = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await apiCall();
            setState({
                data: result,
                loading: false,
                error: null,
            });
        } catch (error) {
            setState({
                data: null,
                loading: false,
                error: error instanceof Error ? error.message : 'An error occurred',
            });
        }
    };

    useEffect(() => {
        if (immediate) {
            fetchData();
        }
    }, []);

    return {
        ...state,
        refetch: fetchData,
    };
}

export default useApi; 