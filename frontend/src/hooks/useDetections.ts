import { useState, useEffect } from 'react';
import { detectionsAPI, Detection, ManualDetection, CreateManualDetection } from '../api/detections';

// Hook for testing database connection health check
export const useDetectionTest = (immediate: boolean = false) => {
    const [data, setData] = useState<{
        success: boolean;
        message: string;
        total_detections: string;
        timestamp: string;
    } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const testConnection = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Testing database connection...');
            const response = await detectionsAPI.testConnection();
            setData(response.data);
            console.log('✅ Database test successful:', response.data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Database connection test failed';
            setError(errorMessage);
            console.error('❌ Database test failed:', err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-run on mount if immediate is true
    useEffect(() => {
        if (immediate) {
            testConnection();
        }
    }, [immediate]);

    return {
        data,
        loading,
        error,
        testConnection,
        // Helper methods
        isHealthy: data?.success === true,
        totalDetections: data?.total_detections,
        lastTested: data?.timestamp
    };
};

// Hook for GET /api/detections/all - Frontend-formatted detection data
export const useAllDetections = (immediate: boolean = true) => {
    const [data, setData] = useState<Detection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState<number>(0);

    const fetchDetections = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching all detections...');
            const response = await detectionsAPI.getAll();
            setData(response.data.data);
            setTotal(response.data.total);
            console.log(`✅ Fetched ${response.data.data.length} detections`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch detections';
            setError(errorMessage);
            console.error('❌ Fetch detections failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate) {
            fetchDetections();
        }
    }, [immediate]);

    return {
        detections: data,
        loading,
        error,
        total,
        refetch: fetchDetections,
        // Helper methods
        hasDetections: data.length > 0,
        isEmpty: data.length === 0
    };
};

// Hook for GET /api/detections/threats - High-priority threats (threat level 6+)
export const useThreats = (immediate: boolean = true) => {
    const [data, setData] = useState<Detection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [threatCount, setThreatCount] = useState<number>(0);
    const [timestamp, setTimestamp] = useState<string>('');

    const fetchThreats = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching high-priority threats...');
            const response = await detectionsAPI.getThreats();
            setData(response.data.active_weapon_threats);
            setThreatCount(response.data.threat_count);
            setTimestamp(response.data.timestamp);
            console.log(`✅ Fetched ${response.data.threat_count} threats`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch threats';
            setError(errorMessage);
            console.error('❌ Fetch threats failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate) {
            fetchThreats();
        }
    }, [immediate]);

    return {
        threats: data,
        loading,
        error,
        threatCount,
        timestamp,
        refetch: fetchThreats,
        // Helper methods
        hasThreats: data.length > 0,
        isCritical: threatCount > 0,
        lastUpdated: timestamp
    };
};

// Hook for GET /api/detections/weapons/:type - Filter by weapon type
export const useDetectionsByWeaponType = (weaponType: string, immediate: boolean = false) => {
    const [data, setData] = useState<Detection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState<number>(0);

    const fetchByWeaponType = async (type?: string) => {
        const typeToFetch = type || weaponType;
        if (!typeToFetch) {
            setError('Weapon type is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching detections for weapon type: ${typeToFetch}`);
            const response = await detectionsAPI.getByWeaponType(typeToFetch);
            setData(response.data.detections);
            setCount(response.data.count);
            console.log(`✅ Fetched ${response.data.count} ${typeToFetch} detections`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to fetch ${typeToFetch} detections`;
            setError(errorMessage);
            console.error('❌ Fetch weapon detections failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate && weaponType) {
            fetchByWeaponType();
        }
    }, [immediate, weaponType]);

    return {
        detections: data,
        loading,
        error,
        count,
        weaponType,
        refetch: fetchByWeaponType,
        // Helper methods
        hasDetections: data.length > 0,
        isEmpty: data.length === 0
    };
};

// Hook for GET /api/detections/manual - Manual detection entries only
export const useManualDetections = (immediate: boolean = true) => {
    const [data, setData] = useState<ManualDetection[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState<number>(0);

    const fetchManualDetections = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('Fetching manual detection entries...');
            const response = await detectionsAPI.getManual();
            setData(response.data.data);
            setCount(response.data.count);
            console.log(`✅ Fetched ${response.data.count} manual detections`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch manual detections';
            setError(errorMessage);
            console.error('❌ Fetch manual detections failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate) {
            fetchManualDetections();
        }
    }, [immediate]);

    return {
        manualDetections: data,
        loading,
        error,
        count,
        refetch: fetchManualDetections,
        // Helper methods
        hasEntries: data.length > 0,
        isEmpty: data.length === 0,
        entryType: 'manual' as const
    };
};

// Hook for GET /api/detections/:id - Specific detection by ID
export const useDetectionById = (id: number | null, immediate: boolean = false) => {
    const [data, setData] = useState<Detection | null>(null);
    const [weaponDetails, setWeaponDetails] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchDetection = async (detectionId?: number) => {
        const idToFetch = detectionId || id;
        if (!idToFetch) {
            setError('Detection ID is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching detection by ID: ${idToFetch}`);
            const response = await detectionsAPI.getById(idToFetch);
            setData(response.data.detection);
            setWeaponDetails(response.data.weapon_details);
            console.log(`✅ Fetched detection ${idToFetch}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : `Failed to fetch detection ${idToFetch}`;
            setError(errorMessage);
            console.error('❌ Fetch detection failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate && id) {
            fetchDetection();
        }
    }, [immediate, id]);

    return {
        detection: data,
        weaponDetails,
        loading,
        error,
        refetch: fetchDetection,
        // Helper methods
        hasDetection: data !== null,
        detectionId: id
    };
};

// Hook for POST /api/detections/manual - Create manual detection entry
export const useCreateManualDetection = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [lastCreated, setLastCreated] = useState<any>(null);

    const createManualDetection = async (data: CreateManualDetection) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            console.log('Creating manual detection entry...', data);
            const response = await detectionsAPI.createManual(data);
            setLastCreated(response.data);
            setSuccess(true);
            console.log(`✅ Created manual detection ID: ${response.data.detection_id}`);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create manual detection';
            setError(errorMessage);
            console.error('❌ Create manual detection failed:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setSuccess(false);
        setLastCreated(null);
    };

    return {
        createManualDetection,
        loading,
        error,
        success,
        lastCreated,
        reset,
        // Helper methods
        isSubmitting: loading,
        wasSuccessful: success
    };
};

// Hook for PUT /api/detections/:id/comment - Add comment to detection
export const useAddComment = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const addComment = async (detectionId: number, comment: string, userName?: string) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            console.log(`Adding comment to detection ${detectionId}:`, comment);
            const response = await detectionsAPI.addComment(detectionId, comment, userName);
            setSuccess(true);
            console.log(`✅ Added comment to detection ${detectionId}`);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to add comment';
            setError(errorMessage);
            console.error('❌ Add comment failed:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setSuccess(false);
    };

    return {
        addComment,
        loading,
        error,
        success,
        reset,
        // Helper methods
        isSubmitting: loading,
        wasSuccessful: success
    };
};

// Hook for DELETE /api/detections/:id - Delete detection record
export const useDeleteDetection = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [deletedDetection, setDeletedDetection] = useState<any>(null);

    const deleteDetection = async (detectionId: number) => {
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            console.log(`Deleting detection ${detectionId}...`);
            const response = await detectionsAPI.delete(detectionId);
            setDeletedDetection(response.data.deleted_detection);
            setSuccess(true);
            console.log(`✅ Deleted detection ${detectionId}`);
            return response.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete detection';
            setError(errorMessage);
            console.error('❌ Delete detection failed:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setError(null);
        setSuccess(false);
        setDeletedDetection(null);
    };

    return {
        deleteDetection,
        loading,
        error,
        success,
        deletedDetection,
        reset,
        // Helper methods
        isDeleting: loading,
        wasSuccessful: success
    };
};

// Hook for GET /api/detections/:id/metrics - Get system metrics for detection
export const useDetectionMetrics = (detectionId: number | null, immediate: boolean = false) => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMetrics = async (id?: number) => {
        const idToFetch = id || detectionId;
        if (!idToFetch) {
            setError('Detection ID is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching metrics for detection ${idToFetch}...`);
            const response = await detectionsAPI.getSystemMetrics(idToFetch);
            setData(response.data.metrics);
            console.log(`✅ Fetched metrics for detection ${idToFetch}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metrics';
            setError(errorMessage);
            console.error('❌ Fetch metrics failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate && detectionId) {
            fetchMetrics();
        }
    }, [immediate, detectionId]);

    return {
        metrics: data,
        loading,
        error,
        refetch: fetchMetrics,
        // Helper methods
        hasMetrics: data !== null,
        detectionId
    };
};

// Hook for GET /api/detections/:id/frame - Get detection frame image
export const useDetectionFrame = (detectionId: number | null, immediate: boolean = false) => {
    const [frameData, setFrameData] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [timestamp, setTimestamp] = useState<string>('');

    const fetchFrame = async (id?: number) => {
        const idToFetch = id || detectionId;
        if (!idToFetch) {
            setError('Detection ID is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log(`Fetching frame for detection ${idToFetch}...`);
            const response = await detectionsAPI.getDetectionFrame(idToFetch);
            setFrameData(response.data.frame_data);
            setTimestamp(response.data.timestamp);
            console.log(`✅ Fetched frame for detection ${idToFetch}`);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch frame';
            setError(errorMessage);
            console.error('❌ Fetch frame failed:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (immediate && detectionId) {
            fetchFrame();
        }
    }, [immediate, detectionId]);

    return {
        frameData,
        loading,
        error,
        timestamp,
        refetch: fetchFrame,
        // Helper methods
        hasFrame: frameData !== null,
        frameDataUri: frameData ? `data:image/jpeg;base64,${frameData}` : null,
        detectionId
    };
}; 