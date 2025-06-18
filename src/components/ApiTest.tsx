import React from 'react';
import { Box, Button, Text, Spinner, Alert, AlertIcon, VStack } from '@chakra-ui/react';
import { useApi } from '../hooks/useApi';
import { apiService } from '../services/apiService';

const ApiTest: React.FC = () => {
    const { data, loading, error, refetch } = useApi(
        () => apiService.healthCheck(),
        false // Don't fetch immediately
    );

    return (
        <Box p={6} maxW="500px" mx="auto">
            <VStack spacing={4} align="stretch">
                <Text fontSize="xl" fontWeight="bold">
                    API Connection Test
                </Text>

                <Button
                    onClick={refetch}
                    colorScheme="blue"
                    isLoading={loading}
                    loadingText="Testing..."
                >
                    Test Backend Connection
                </Button>

                {loading && (
                    <Box display="flex" alignItems="center" gap={2}>
                        <Spinner size="sm" />
                        <Text>Connecting to backend...</Text>
                    </Box>
                )}

                {error && (
                    <Alert status="error">
                        <AlertIcon />
                        <Text>Error: {error}</Text>
                    </Alert>
                )}

                {data && (
                    <Alert status="success">
                        <AlertIcon />
                        <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">✅ Backend Connected Successfully!</Text>
                            <Text fontSize="sm">Message: {data.message}</Text>
                            <Text fontSize="sm">Timestamp: {data.timestamp}</Text>
                        </VStack>
                    </Alert>
                )}
            </VStack>
        </Box>
    );
};

export default ApiTest; 