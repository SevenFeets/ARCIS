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
        try {
            console.log('Fetching frame data for threat ID:', threat.id);
            const response = await detectionsAPI.getDetectionFrame(threat.id);
            console.log('Frame data response:', response.data);
            setFrameData(response.data.frame_data);
        } catch (error) {
            console.error('Error fetching frame data:', error);
            setFrameError('No frame data available');
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
                                            src={`data:image/jpeg;base64,${frameData}`}
                                            alt="Detection Frame"
                                            maxW="100%"
                                            maxH="300px"
                                            objectFit="contain"
                                            border="1px solid"
                                            borderColor="gray.200"
                                            borderRadius="md"
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