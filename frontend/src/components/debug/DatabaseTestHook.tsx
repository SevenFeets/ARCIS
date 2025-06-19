import React from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    Badge,
    Alert,
    AlertIcon,
    Spinner,
    HStack,
    Card,
    CardHeader,
    CardBody,
    Heading
} from '@chakra-ui/react';
import { useDetectionTest } from '../../hooks/useDetections';

const DatabaseTestHook: React.FC = () => {
    const {
        data,
        loading,
        error,
        testConnection,
        isHealthy,
        totalDetections,
        lastTested
    } = useDetectionTest();

    return (
        <Card maxW="md" mx="auto">
            <CardHeader>
                <Heading size="md">🗄️ Database Health Check Hook</Heading>
            </CardHeader>
            <CardBody>
                <VStack spacing={4} align="stretch">
                    <Button
                        onClick={testConnection}
                        colorScheme="blue"
                        isLoading={loading}
                        loadingText="Testing Connection..."
                    >
                        Test Database Connection
                    </Button>

                    {loading && (
                        <HStack>
                            <Spinner size="sm" />
                            <Text>Checking database connection...</Text>
                        </HStack>
                    )}

                    {error && (
                        <Alert status="error">
                            <AlertIcon />
                            <Text fontSize="sm">{error}</Text>
                        </Alert>
                    )}

                    {data && (
                        <Alert status={isHealthy ? "success" : "error"}>
                            <AlertIcon />
                            <VStack align="start" spacing={2}>
                                <HStack>
                                    <Text fontWeight="bold">Status:</Text>
                                    <Badge colorScheme={isHealthy ? 'green' : 'red'}>
                                        {isHealthy ? 'Healthy' : 'Unhealthy'}
                                    </Badge>
                                </HStack>
                                <Text fontSize="sm"><strong>Message:</strong> {data.message}</Text>
                                <Text fontSize="sm"><strong>Total Detections:</strong> {totalDetections}</Text>
                                <Text fontSize="xs" color="gray.500">
                                    Last tested: {lastTested ? new Date(lastTested).toLocaleString() : 'N/A'}
                                </Text>
                            </VStack>
                        </Alert>
                    )}

                    {/* Debug Info */}
                    <Box fontSize="xs" color="gray.500" p={2} bg="gray.50" borderRadius="md">
                        <Text><strong>Hook State:</strong></Text>
                        <Text>Loading: {loading ? 'true' : 'false'}</Text>
                        <Text>Healthy: {isHealthy ? 'true' : 'false'}</Text>
                        <Text>Has Data: {data ? 'true' : 'false'}</Text>
                        <Text>Has Error: {error ? 'true' : 'false'}</Text>
                    </Box>
                </VStack>
            </CardBody>
        </Card>
    );
};

export default DatabaseTestHook; 