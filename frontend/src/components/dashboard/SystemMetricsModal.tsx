import React, { useState, useEffect } from 'react';
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    VStack,
    HStack,
    Text,
    Badge,
    Divider,
    Grid,
    Box,
    Spinner,
    Alert,
    AlertIcon,
    Progress
} from '@chakra-ui/react';
import { detectionsAPI } from '../../api/detections';

interface SystemMetricsModalProps {
    isOpen: boolean;
    onClose: () => void;
    detectionId: number;
}

const SystemMetricsModal: React.FC<SystemMetricsModalProps> = ({ isOpen, onClose, detectionId }) => {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && detectionId) {
            fetchMetrics();
        }
        // Reset state when modal closes
        if (!isOpen) {
            setMetrics(null);
            setError(null);
        }
    }, [isOpen, detectionId]);

    const fetchMetrics = async () => {
        if (!detectionId) {
            setError('No detection ID provided');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            console.log('Fetching metrics for detection ID:', detectionId);
            const response = await detectionsAPI.getSystemMetrics(detectionId);
            console.log('Metrics response:', response.data);
            setMetrics(response.data.metrics);
        } catch (error) {
            console.error('Error fetching metrics:', error);
            const errorMessage = 'Failed to load system metrics - this detection may not have metrics data';
            setError(errorMessage);
            // Don't show toast for missing metrics, just show in modal
        } finally {
            setLoading(false);
        }
    };

    const formatValue = (value: any, unit?: string) => {
        if (value === null || value === undefined || value === 'N/A') {
            return 'N/A';
        }
        return unit ? `${value}${unit}` : value.toString();
    };

    const getPerformanceColor = (value: any, type: 'cpu' | 'gpu' | 'ram' | 'disk') => {
        if (value === 'N/A' || !value) return 'gray';
        const numValue = parseFloat(value.toString());

        switch (type) {
            case 'cpu':
            case 'gpu':
            case 'ram':
            case 'disk':
                if (numValue > 80) return 'red';
                if (numValue > 60) return 'orange';
                if (numValue > 40) return 'yellow';
                return 'green';
            default:
                return 'blue';
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    📊 System Metrics - Detection #{detectionId}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {loading && (
                        <Box textAlign="center" py={8}>
                            <Spinner size="lg" />
                            <Text mt={4}>Loading system metrics...</Text>
                        </Box>
                    )}

                    {error && (
                        <Alert status="error">
                            <AlertIcon />
                            {error}
                        </Alert>
                    )}

                    {metrics && !loading && (
                        <VStack spacing={4} align="stretch">
                            {/* Detection Info */}
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" mb={3}>Detection Information</Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Confidence Score</Text>
                                        <Text fontSize="lg" fontWeight="bold" color="blue.500">
                                            {metrics.confidence_score}%
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Threat Level</Text>
                                        <Badge
                                            colorScheme={metrics.threat_level >= 7 ? 'red' : metrics.threat_level >= 5 ? 'orange' : 'green'}
                                            fontSize="md"
                                        >
                                            Level {metrics.threat_level}
                                        </Badge>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Device Type</Text>
                                        <Text fontWeight="medium">{metrics.device_type}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Device ID</Text>
                                        <Text fontWeight="medium">{metrics.device_id}</Text>
                                    </Box>
                                </Grid>
                            </Box>

                            <Divider />

                            {/* System Performance */}
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" mb={3}>System Performance</Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm" color="gray.500">CPU Usage</Text>
                                            <Text fontWeight="bold">{formatValue(metrics.cpu_usage, '%')}</Text>
                                        </HStack>
                                        {metrics.cpu_usage !== 'N/A' && (
                                            <Progress
                                                value={parseFloat(metrics.cpu_usage)}
                                                colorScheme={getPerformanceColor(metrics.cpu_usage, 'cpu')}
                                                size="sm"
                                                mt={1}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm" color="gray.500">GPU Usage</Text>
                                            <Text fontWeight="bold">{formatValue(metrics.gpu_usage, '%')}</Text>
                                        </HStack>
                                        {metrics.gpu_usage !== 'N/A' && (
                                            <Progress
                                                value={parseFloat(metrics.gpu_usage)}
                                                colorScheme={getPerformanceColor(metrics.gpu_usage, 'gpu')}
                                                size="sm"
                                                mt={1}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm" color="gray.500">RAM Usage</Text>
                                            <Text fontWeight="bold">{formatValue(metrics.ram_usage, '%')}</Text>
                                        </HStack>
                                        {metrics.ram_usage !== 'N/A' && (
                                            <Progress
                                                value={parseFloat(metrics.ram_usage)}
                                                colorScheme={getPerformanceColor(metrics.ram_usage, 'ram')}
                                                size="sm"
                                                mt={1}
                                            />
                                        )}
                                    </Box>
                                    <Box>
                                        <HStack justify="space-between">
                                            <Text fontSize="sm" color="gray.500">Disk Usage</Text>
                                            <Text fontWeight="bold">{formatValue(metrics.disk_usage, '%')}</Text>
                                        </HStack>
                                        {metrics.disk_usage !== 'N/A' && (
                                            <Progress
                                                value={parseFloat(metrics.disk_usage)}
                                                colorScheme={getPerformanceColor(metrics.disk_usage, 'disk')}
                                                size="sm"
                                                mt={1}
                                            />
                                        )}
                                    </Box>
                                </Grid>
                            </Box>

                            <Divider />

                            {/* Temperature & Voltage */}
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" mb={3}>Temperature & Voltage</Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">CPU Temperature</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.cpu_temp, '°C')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">GPU Temperature</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.gpu_temp, '°C')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">CPU Voltage</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.cpu_voltage, 'V')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">GPU Voltage</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.gpu_voltage, 'V')}</Text>
                                    </Box>
                                </Grid>
                            </Box>

                            <Divider />

                            {/* Network & Detection Metrics */}
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" mb={3}>Network & Detection</Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Network Status</Text>
                                        <Badge colorScheme={metrics.network_status === 'Connected' ? 'green' : 'red'}>
                                            {metrics.network_status}
                                        </Badge>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Network Speed</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.network_speed, ' Mbps')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Signal Strength</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.network_signal_strength, ' dBm')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Detection Latency</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.detection_latency, ' ms')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Distance to Detection</Text>
                                        <Text fontWeight="bold">{formatValue(metrics.distance_to_detection, ' m')}</Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Alert Played</Text>
                                        <Badge colorScheme={metrics.alert_played ? 'green' : 'red'}>
                                            {metrics.alert_played ? 'Yes' : 'No'}
                                        </Badge>
                                    </Box>
                                </Grid>
                            </Box>

                            <Divider />

                            {/* Database Status */}
                            <Box>
                                <Text fontSize="lg" fontWeight="bold" mb={3}>System Status</Text>
                                <HStack>
                                    <Text fontSize="sm" color="gray.500">Database Status:</Text>
                                    <Badge colorScheme={metrics.database_status === 'Connected' ? 'green' : 'red'}>
                                        {metrics.database_status}
                                    </Badge>
                                </HStack>
                                <Text fontSize="xs" color="gray.400" mt={2}>
                                    Last updated: {new Date(metrics.timestamp).toLocaleString()}
                                </Text>
                            </Box>
                        </VStack>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={fetchMetrics} isLoading={loading}>
                        🔄 Refresh
                    </Button>
                    <Button onClick={onClose}>Close</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SystemMetricsModal; 