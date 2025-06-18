import api from '../api/axios';

export interface Detection {
    detection_id: number;
    object_type: string;
    confidence: number;
    threat_level: number;
    timestamp: string;
    metadata: any;
    bounding_box: any;
}

export const detectionsService = {
    // Get all weapon detections
    getAllDetections: async (page = 1, limit = 50) => {
        const response = await api.get(`/detections?page=${page}&limit=${limit}`);
        return response.data;
    },

    // Get high-threat detections
    getThreats: async () => {
        const response = await api.get('/detections/threats');
        return response.data;
    },

    // Get specific detection by ID
    getDetection: async (id: number) => {
        const response = await api.get(`/detections/${id}`);
        return response.data;
    },

    // Get detections by weapon type
    getByWeaponType: async (weaponType: string) => {
        const response = await api.get(`/detections/weapons/${weaponType}`);
        return response.data;
    },

    // Delete detection (if you add this endpoint)
    deleteDetection: async (id: number) => {
        const response = await api.delete(`/detections/${id}`);
        return response.data;
    },

    // Add comment to detection (if you add this endpoint)
    addComment: async (id: number, comment: string) => {
        const response = await api.put(`/detections/${id}/comment`, { comment });
        return response.data;
    }
};

export default detectionsService; 