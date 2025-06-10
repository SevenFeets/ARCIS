import api from './axios';

export interface Detection {
    id: number;
    detection_id?: number; // Some endpoints return detection_id instead of id
    weapon_type: string;
    confidence: number;
    threat_level: number;
    location: string;
    timestamp: string;
    device: string;
    device_id: string;
    bounding_box: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    comments: Array<{
        id: number;
        comment: string;
        user_name: string;
        timestamp: string;
    }>;
    metadata: any;
}

export interface ManualDetection extends Detection {
    officer_name: string;
    officer_id: number;
    description: string;
    notes: string;
    entry_type: 'manual';
}

export interface CreateManualDetection {
    object_type: string;
    confidence: number;
    location: string;
    description?: string;
    officer_id?: number;
    officer_name?: string;
    notes?: string;
    bounding_box?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

// Detection API Functions
export const detectionsAPI = {
    // Get all detections (formatted for frontend)
    getAll: () => api.get<{
        success: boolean;
        data: Detection[];
        total: number;
        message: string;
    }>('/detections/all'),

    // Get detection by ID
    getById: (id: number) => api.get<{
        detection: Detection;
        weapon_details: any;
    }>(`/detections/${id}`),

    // Get current high-threat detections
    getThreats: () => api.get<{
        active_weapon_threats: Detection[];
        threat_count: number;
        timestamp: string;
    }>('/detections/threats'),

    // Get detections by weapon type
    getByWeaponType: (weaponType: string) => api.get<{
        weapon_type: string;
        detections: Detection[];
        count: number;
    }>(`/detections/weapons/${weaponType}`),

    // Get manual detection entries only
    getManual: () => api.get<{
        success: boolean;
        data: ManualDetection[];
        count: number;
        message: string;
        entry_type: string;
    }>('/detections/manual'),

    // Add comment to detection
    addComment: (id: number, comment: string, userName?: string) => api.put<{
        success: boolean;
        message: string;
        detection_id: number;
        comment: any;
        total_comments: number;
    }>(`/detections/${id}/comment`, {
        comment,
        userName: userName || 'Anonymous User',
        userId: 1
    }),

    // Create manual detection entry
    createManual: (data: CreateManualDetection) => api.post<{
        success: boolean;
        detection_id: number;
        weapon_type: string;
        threat_level: number;
        confidence: number;
        location: string;
        officer: string;
        entry_type: string;
    }>('/detections/manual', data),

    // Delete detection
    delete: (id: number) => api.delete<{
        success: boolean;
        message: string;
        deleted_detection: {
            id: number;
            weapon_type: string;
            threat_level: number;
            deleted_at: string;
        };
    }>(`/detections/${id}`),

    // Test database connection
    testConnection: () => api.get<{
        success: boolean;
        message: string;
        total_detections: string;
        timestamp: string;
    }>('/detections/test'),

    // Get system metrics for a detection
    getSystemMetrics: (id: number) => api.get<{
        success: boolean;
        metrics: {
            detection_id: number;
            timestamp: string;
            confidence_score: number;
            threat_level: number;
            device_type: string;
            device_id: string;
            cpu_usage: string | number;
            gpu_usage: string | number;
            ram_usage: string | number;
            cpu_temp: string | number;
            gpu_temp: string | number;
            cpu_voltage: string | number;
            gpu_voltage: string | number;
            network_status: string;
            network_speed: string | number;
            network_signal_strength: string | number;
            disk_usage: string | number;
            detection_latency: string | number;
            distance_to_detection: string | number;
            database_status: string;
            alert_played: boolean;
            raw_system_metrics: any;
            raw_metadata: any;
        };
        message: string;
    }>(`/detections/${id}/metrics`),

    // Get detection frame image
    getDetectionFrame: (id: number) => api.get<{
        success: boolean;
        detection_id: number;
        frame_data: string; // Base64 encoded image
        timestamp: string;
        message: string;
    }>(`/detections/${id}/frame`)
}; 