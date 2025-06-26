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

    Grid,
    Box,
    Spinner,
    Alert,
    AlertIcon,
    Image,
    useToast,
    useColorModeValue
} from '@chakra-ui/react';
import { Detection, detectionsAPI } from '../../api/detections';

interface ExpandThreatModalProps {
    isOpen: boolean;
    onClose: () => void;
    threat: Detection;
}

const ExpandThreatModal: React.FC<ExpandThreatModalProps> = ({ isOpen, onClose, threat }) => {
    const [frameData, setFrameData] = useState<string | null>(null);
    const [frameLoading, setFrameLoading] = useState(false);
    const [frameError, setFrameError] = useState<string | null>(null);
    const toast = useToast();

    // Add console log for debugging
    console.log('ExpandThreatModal render:', { isOpen, threat });
    console.log('Threat detection_frame_data:', threat?.detection_frame_data ? 'Present' : 'Missing');
    console.log('Frame data length:', threat?.detection_frame_data?.length || 0);

    // Theme colors
    const bgColor = useColorModeValue('#ffffff', '#2D3748');

    useEffect(() => {
        if (isOpen && threat?.id) {
            fetchFrameData();
        }
        // Reset state when modal closes
        if (!isOpen) {
            setFrameData(null);
            setFrameError(null);
        }
    }, [isOpen, threat]);

    const fetchFrameData = async () => {
        if (!threat?.id) {
            console.error('No threat ID available');
            setFrameError('Invalid threat data');
            return;
        }

        setFrameLoading(true);
        setFrameError(null);

        // Priority 1: Check for binary JPEG endpoint (NEW FORMAT - BEST PERFORMANCE)
        if (threat.has_binary_jpeg && threat.jpeg_endpoint) {
            console.log('🚀 Using binary JPEG endpoint:', threat.jpeg_endpoint);
            const fullUrl = threat.jpeg_endpoint.startsWith('http')
                ? threat.jpeg_endpoint
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${threat.jpeg_endpoint}`;
            console.log('🔗 Binary JPEG URL:', fullUrl);
            setFrameData(fullUrl);
            setFrameLoading(false);
            return;
        }

        // Priority 2: Check for file URL (legacy file storage)
        if (threat.frame_url) {
            console.log('🖼️ Using frame URL from threat object:', threat.frame_url);
            const fullUrl = threat.frame_url.startsWith('http')
                ? threat.frame_url
                : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${threat.frame_url}`;
            console.log('🔗 Full image URL:', fullUrl);
            setFrameData(fullUrl);
            setFrameLoading(false);
            return;
        }

        // Priority 3: Check for embedded base64 data (legacy format)
        if (threat.detection_frame_data) {
            console.log('📸 Using embedded base64 frame data from threat object');
            const base64Url = threat.detection_frame_data.startsWith('data:')
                ? threat.detection_frame_data
                : `data:image/png;base64,${threat.detection_frame_data}`;
            setFrameData(base64Url);
            setFrameLoading(false);
            return;
        }

        // Priority 4: Try binary JPEG endpoint by ID (fallback)
        try {
            console.log('🔄 Trying binary JPEG endpoint for threat ID:', threat.id);
            const jpegUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/detections/${threat.id}/jpeg`;
            console.log('🔗 Trying JPEG URL:', jpegUrl);

            // Test if the endpoint returns an image
            const testResponse = await fetch(jpegUrl, { method: 'HEAD' });
            if (testResponse.ok && testResponse.headers.get('content-type')?.includes('image/jpeg')) {
                console.log('✅ Binary JPEG endpoint available');
                setFrameData(jpegUrl);
                setFrameLoading(false);
                return;
            }
        } catch (error) {
            console.log('⚠️ Binary JPEG endpoint not available:', error);
        }

        // Priority 5: Fetch from legacy API as last resort
        try {
            console.log('🔄 Fetching frame data from legacy API for threat ID:', threat.id);
            const response = await detectionsAPI.getDetectionFrame(threat.id);
            console.log('📡 Frame API response:', response);

            if (response.data && response.data.frame_data) {
                console.log('✅ Frame data found via API, length:', response.data.frame_data.length);
                const base64Url = response.data.frame_data.startsWith('data:')
                    ? response.data.frame_data
                    : `data:image/png;base64,${response.data.frame_data}`;
                setFrameData(base64Url);
            } else {
                console.error('❌ No frame_data in API response:', response.data);
                setFrameError('No frame data available');
            }
        } catch (error) {
            console.error('❌ Error fetching frame data from API:', error);
            setFrameError('Failed to fetch frame data');
        } finally {
            setFrameLoading(false);
        }
    };

    const getThreatLevelColor = (level: number) => {
        if (level >= 9) return 'red';
        if (level >= 7) return 'orange';
        if (level >= 5) return 'yellow';
        return 'green';
    };

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const getWeaponTypeIcon = (weaponType: string) => {
        if (!weaponType) return '⚠️';
        switch (weaponType.toLowerCase()) {
            case 'rifle': return '🔫';
            case 'pistol': return '🔫';
            case 'knife': return '🗡️';
            default: return '⚠️';
        }
    };

    // Safety check for threat object
    if (!threat) {
        console.error('ExpandThreatModal: No threat object provided');
        return null;
    }

    // Log threat object structure for debugging
    console.log('ExpandThreatModal threat object:', threat);

    // Add error boundary for the component
    try {
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent
                    maxW="90vw"
                    maxH="90vh"
                    bg={bgColor}
                >
                    <ModalHeader
                        bg="red.500"
                        color="white"
                        fontSize="xl"
                    >
                        ⚠️ THREAT DETAILS - {threat.weapon_type || 'Unknown'}
                    </ModalHeader>
                    <ModalCloseButton color="white" />

                    <ModalBody overflowY="auto">
                        <VStack spacing={4} align="stretch">
                            {/* Main Threat Info */}
                            <Box p={4} border="2px solid red" borderRadius="lg" bg="red.50" _dark={{ bg: "red.900", opacity: 0.3 }}>
                                <HStack spacing={4} mb={4}>
                                    <Text fontSize="3xl">{getWeaponTypeIcon(threat.weapon_type || '')}</Text>
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="xl" fontWeight="bold" color="red.600" _dark={{ color: "red.300" }}>
                                            {(threat.weapon_type || 'Unknown').toUpperCase()}
                                        </Text>
                                        <Badge colorScheme={getThreatLevelColor(threat.threat_level || 5)} variant="solid" fontSize="md">
                                            THREAT LEVEL {threat.threat_level || 5}
                                        </Badge>
                                    </VStack>
                                </HStack>
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Confidence</Text>
                                        <Text fontSize="2xl" fontWeight="bold" color="red.600" _dark={{ color: "red.300" }}>
                                            {threat.confidence || 0}%
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Detection Time</Text>
                                        <Text fontSize="md" fontWeight="bold">{formatTimestamp(threat.timestamp)}</Text>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Location & Device Info */}
                            <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="lg">
                                <Text fontSize="lg" fontWeight="bold" mb={3}>📍 Location & Device</Text>
                                <VStack spacing={2} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="medium">Location:</Text>
                                        <Text fontWeight="bold" color="orange.500">{threat.location || 'Unknown'}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="medium">Device:</Text>
                                        <Text fontWeight="bold" color="blue.500">{threat.device || 'Unknown'}</Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="medium">Device ID:</Text>
                                        <Text>{threat.device_id || 'Unknown'}</Text>
                                    </HStack>
                                </VStack>
                            </Box>

                            {/* Detection Frame */}
                            <Box p={4} border="1px solid" borderColor="gray.200" borderRadius="lg">
                                <Text fontSize="lg" fontWeight="bold" mb={3}>📸 Detection Frame</Text>

                                {frameLoading && (
                                    <Box textAlign="center" py={8}>
                                        <Spinner size="lg" />
                                        <Text mt={4}>Loading detection frame...</Text>
                                    </Box>
                                )}

                                {frameError && (
                                    <Alert status="warning">
                                        <AlertIcon />
                                        <Text>Detection frame not available</Text>
                                    </Alert>
                                )}

                                {frameData && !frameLoading && (
                                    <Box>
                                        <Image
                                            src={frameData}
                                            alt="Detection Frame"
                                            maxW="100%"
                                            maxH="300px"
                                            objectFit="contain"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="md"
                                            onLoad={() => {
                                                console.log('✅ Image loaded successfully!');
                                            }}
                                            onError={(e) => {
                                                console.error('❌ Image failed to load:', e);
                                                console.log('Frame data format:', frameData.substring(0, 100));
                                                console.log('Frame data length:', frameData.length);

                                                // If this was a binary JPEG URL that failed, try fallback methods
                                                if (frameData.includes('/jpeg')) {
                                                    console.log('🔄 Binary JPEG failed, trying fallback methods...');
                                                    setFrameData(null);
                                                    setFrameError(null);
                                                    setFrameLoading(true);

                                                    // Try legacy API as fallback
                                                    detectionsAPI.getDetectionFrame(threat.id)
                                                        .then(response => {
                                                            if (response.data && response.data.frame_data) {
                                                                console.log('✅ Fallback: Frame data found via API');
                                                                const base64Url = response.data.frame_data.startsWith('data:')
                                                                    ? response.data.frame_data
                                                                    : `data:image/png;base64,${response.data.frame_data}`;
                                                                setFrameData(base64Url);
                                                            } else {
                                                                console.error('❌ Fallback: No frame_data in API response');
                                                                setFrameError('No frame data available');
                                                            }
                                                        })
                                                        .catch(error => {
                                                            console.error('❌ Fallback: Error fetching frame data from API:', error);
                                                            setFrameError('Failed to fetch frame data');
                                                        })
                                                        .finally(() => {
                                                            setFrameLoading(false);
                                                        });
                                                } else {
                                                    setFrameError('Image failed to display');
                                                }
                                            }}
                                        />
                                        <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                                            Frame captured at {formatTimestamp(threat.timestamp)}
                                        </Text>
                                    </Box>
                                )}

                                {!frameData && !frameLoading && !frameError && (
                                    <Box
                                        w="100%"
                                        h="200px"
                                        bg="gray.100"
                                        _dark={{ bg: "gray.700" }}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        border="1px dashed"
                                        borderColor="gray.300"
                                        borderRadius="md"
                                    >
                                        <VStack>
                                            <Text fontSize="3xl">📷</Text>
                                            <Text color="gray.500">No frame data available</Text>
                                        </VStack>
                                    </Box>
                                )}
                            </Box>

                            {/* Action Buttons */}
                            <HStack spacing={4}>
                                <Button
                                    colorScheme="orange"
                                    onClick={fetchFrameData}
                                    isLoading={frameLoading}
                                    flex={1}
                                >
                                    🔄 Refresh Frame
                                </Button>
                                <Button
                                    colorScheme="green"
                                    onClick={() => {
                                        toast({
                                            title: "Alert Acknowledged",
                                            description: "Threat acknowledged by security personnel",
                                            status: "info",
                                            duration: 3000,
                                            isClosable: true,
                                        });
                                    }}
                                    flex={1}
                                >
                                    ✅ Acknowledge
                                </Button>
                            </HStack>
                        </VStack>
                    </ModalBody>

                    <ModalFooter>
                        <HStack spacing={4} width="100%" justify="space-between">
                            <Text fontSize="sm" color="gray.500">
                                Detection ID: {threat.id || threat.detection_id || 'Unknown'}
                            </Text>
                            <Button colorScheme="gray" onClick={onClose}>
                                Close
                            </Button>
                        </HStack>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        );
    } catch (error) {
        console.error('ExpandThreatModal render error:', error);
        return (
            <Modal isOpen={isOpen} onClose={onClose} size="sm">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader color="red.500">Error</ModalHeader>
                    <ModalBody>
                        <Text>Unable to display threat details. Please try again.</Text>
                        <Text fontSize="sm" color="gray.500" mt={2}>Error: {String(error)}</Text>
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        );
    }
};

export default ExpandThreatModal; 