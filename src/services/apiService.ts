import api from '../api/axios';

// API service functions
export const apiService = {
    // Health check
    healthCheck: async () => {
        try {
            const response = await api.get('/health');
            return response.data;
        } catch (error) {
            console.error('Health check failed:', error);
            throw error;
        }
    },

    // Example GET request
    getData: async (endpoint: string) => {
        try {
            const response = await api.get(endpoint);
            return response.data;
        } catch (error) {
            console.error(`GET ${endpoint} failed:`, error);
            throw error;
        }
    },

    // Example POST request
    postData: async (endpoint: string, data: any) => {
        try {
            const response = await api.post(endpoint, data);
            return response.data;
        } catch (error) {
            console.error(`POST ${endpoint} failed:`, error);
            throw error;
        }
    },

    // Example PUT request
    putData: async (endpoint: string, data: any) => {
        try {
            const response = await api.put(endpoint, data);
            return response.data;
        } catch (error) {
            console.error(`PUT ${endpoint} failed:`, error);
            throw error;
        }
    },

    // Example DELETE request
    deleteData: async (endpoint: string) => {
        try {
            const response = await api.delete(endpoint);
            return response.data;
        } catch (error) {
            console.error(`DELETE ${endpoint} failed:`, error);
            throw error;
        }
    },
};

export default apiService; 