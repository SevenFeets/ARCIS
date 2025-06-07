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

    // Theme colors
    const bgColor = useColorModeValue('#ffffff', '#2D3748');
    const borderColor = useColorModeValue('#e0e0e0', '#4A5568');
    const textColor = useColorModeValue('#1A202C', '#F7FAFC');

    useEffect(() => {
        if (isOpen && threat?.id) {
            fetchFrameData();
        }
    }, [isOpen, threat]);

    const fetchFrameData = async () => {
        setFrameLoading(true);
        setFrameError(null);
        try {
            const response = await detectionsAPI.getDetectionFrame(threat.id);
            setFrameData(response.data.frame_data);
        } catch (error) {
            setFrameError('No frame data available');
            console.log('Frame data not available for this detection');
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="6xl">
            <ModalOverlay bg="blackAlpha.800" />
            <ModalContent
                maxW="95vw"
                maxH="95vh"
                bg={bgColor}
                border={`2px solid ${borderColor}`}
            >
                <ModalHeader
                    bg="red.500"
                    color="white"
                    fontSize="2xl"
                    py={6}
                    borderTopRadius="md"
                >
                    ⚠️ THREAT DETAILS - EXPANDED VIEW
                </ModalHeader>
                <ModalCloseButton color="white" size="lg" />

                <ModalBody p={8} overflowY="auto">
                    <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={8} h="full">
                        {/* Left Column - Threat Information */}
                        <VStack spacing={6} align="stretch">
                            {/* Main Threat Info */}
                            <Box
                                p={6}
                                border={`2px solid red`}
                                borderRadius="lg"
                                bg="red.50"
                                _dark={{ bg: "red.900", opacity: 0.3 }}
                            >
                                <HStack spacing={4} mb={4}>
                                    <Text fontSize="4xl">
                                        {getWeaponTypeIcon(threat.weapon_type)}
                                    </Text>
                                    <VStack align="start" spacing={2}>
                                        <Text fontSize="2xl" fontWeight="bold" color="red.600" _dark={{ color: "red.300" }}>
                                            {threat.weapon_type.toUpperCase()}
                                        </Text>
                                        <Badge
                                            colorScheme={getThreatLevelColor(threat.threat_level)}
                                            variant="solid"
                                            fontSize="lg"
                                            px={3}
                                            py={1}
                                        >
                                            THREAT LEVEL {threat.threat_level}
                                        </Badge>
                                    </VStack>
                                </HStack>

                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Confidence</Text>
                                        <Text fontSize="3xl" fontWeight="bold" color="red.600" _dark={{ color: "red.300" }}>
                                            {threat.confidence}%
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.600" _dark={{ color: "gray.300" }}>Detection Time</Text>
                                        <Text fontSize="lg" fontWeight="bold" color={textColor}>
                                            {formatTimestamp(threat.timestamp)}
                                        </Text>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Location & Device Info */}
                            <Box p={6} border={`1px solid ${borderColor}`} borderRadius="lg" bg={bgColor}>
                                <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
                                    📍 Location & Device Information
                                </Text>
                                <VStack spacing={4} align="stretch">
                                    <HStack justify="space-between">
                                        <Text fontWeight="medium" color={textColor}>Location:</Text>
                                        <Text fontSize="lg" fontWeight="bold" color="orange.500">
                                            {threat.location || 'Unknown Location'}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="medium" color={textColor}>Device:</Text>
                                        <Text fontSize="lg" fontWeight="bold" color="blue.500">
                                            {threat.device}
                                        </Text>
                                    </HStack>
                                    <HStack justify="space-between">
                                        <Text fontWeight="medium" color={textColor}>Device ID:</Text>
                                        <Text fontSize="md" color={textColor}>
                                            {threat.device_id}
                                        </Text>
                                    </HStack>
                                </VStack>
                            </Box>

                            {/* Bounding Box Info */}
                            <Box p={6} border={`1px solid ${borderColor}`} borderRadius="lg" bg={bgColor}>
                                <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
                                    🎯 Detection Area
                                </Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Position (x, y)</Text>
                                        <Text fontWeight="bold" color={textColor}>
                                            ({threat.bounding_box.x}, {threat.bounding_box.y})
                                        </Text>
                                    </Box>
                                    <Box>
                                        <Text fontSize="sm" color="gray.500">Dimensions</Text>
                                        <Text fontWeight="bold" color={textColor}>
                                            {threat.bounding_box.width} × {threat.bounding_box.height}
                                        </Text>
                                    </Box>
                                </Grid>
                            </Box>

                            {/* Comments */}
                            <Box p={6} border={`1px solid ${borderColor}`} borderRadius="lg" bg={bgColor}>
                                <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
                                    💬 Comments ({threat.comments?.length || 0})
                                </Text>
                                {threat.comments && threat.comments.length > 0 ? (
                                    <VStack spacing={3} align="stretch" maxH="200px" overflowY="auto">
                                        {threat.comments.map((comment) => (
                                            <Box key={comment.id} p={3} bg="gray.100" _dark={{ bg: "gray.700" }} borderRadius="md">
                                                <Text fontSize="sm" color={textColor}>{comment.comment}</Text>
                                                <Text fontSize="xs" color="gray.500" mt={1}>
                                                    by {comment.user_name} • {formatTimestamp(comment.timestamp)}
                                                </Text>
                                            </Box>
                                        ))}
                                    </VStack>
                                ) : (
                                    <Text color="gray.500" fontStyle="italic">No comments available</Text>
                                )}
                            </Box>
                        </VStack>

                        {/* Right Column - Detection Frame */}
                        <VStack spacing={6} align="stretch">
                            <Box p={6} border={`1px solid ${borderColor}`} borderRadius="lg" bg={bgColor}>
                                <Text fontSize="xl" fontWeight="bold" mb={4} color={textColor}>
                                    📸 Detection Frame
                                </Text>

                                {frameLoading && (
                                    <Box textAlign="center" py={8}>
                                        <Spinner size="lg" />
                                        <Text mt={4} color={textColor}>Loading detection frame...</Text>
                                    </Box>
                                )}

                                {frameError && (
                                    <Alert status="warning">
                                        <AlertIcon />
                                        <VStack align="start" spacing={1}>
                                            <Text>Detection frame not available</Text>
                                            <Text fontSize="sm">
                                                This detection was recorded before frame storage was implemented
                                            </Text>
                                        </VStack>
                                    </Alert>
                                )}

                                {frameData && !frameLoading && (
                                    <Box>
                                        <Image
                                            src={`data:image/jpeg;base64,${frameData}`}
                                            alt="Detection Frame"
                                            maxW="100%"
                                            maxH="400px"
                                            objectFit="contain"
                                            border={`2px solid ${borderColor}`}
                                            borderRadius="md"
                                            fallback={
                                                <Box
                                                    w="100%"
                                                    h="300px"
                                                    bg="gray.200"
                                                    _dark={{ bg: "gray.600" }}
                                                    display="flex"
                                                    alignItems="center"
                                                    justifyContent="center"
                                                    border={`1px solid ${borderColor}`}
                                                    borderRadius="md"
                                                >
                                                    <Text color="gray.500">Failed to load image</Text>
                                                </Box>
                                            }
                                        />
                                        <Text fontSize="xs" color="gray.500" mt={2} textAlign="center">
                                            Detection frame captured at {formatTimestamp(threat.timestamp)}
                                        </Text>
                                    </Box>
                                )}

                                {!frameData && !frameLoading && !frameError && (
                                    <Box
                                        w="100%"
                                        h="300px"
                                        bg="gray.100"
                                        _dark={{ bg: "gray.700" }}
                                        display="flex"
                                        alignItems="center"
                                        justifyContent="center"
                                        border={`1px dashed ${borderColor}`}
                                        borderRadius="md"
                                    >
                                        <VStack>
                                            <Text fontSize="4xl">📷</Text>
                                            <Text color="gray.500">No frame data available</Text>
                                        </VStack>
                                    </Box>
                                )}
                            </Box>

                            {/* Action Buttons */}
                            <VStack spacing={4}>
                                <Button
                                    colorScheme="orange"
                                    size="lg"
                                    width="100%"
                                    onClick={fetchFrameData}
                                    isLoading={frameLoading}
                                >
                                    🔄 Refresh Frame Data
                                </Button>

                                <Button
                                    colorScheme="red"
                                    variant="outline"
                                    size="lg"
                                    width="100%"
                                    onClick={() => {
                                        toast({
                                            title: "Alert Acknowledged",
                                            description: "Threat has been acknowledged by security personnel",
                                            status: "info",
                                            duration: 3000,
                                            isClosable: true,
                                        });
                                    }}
                                >
                                    ✅ Acknowledge Threat
                                </Button>
                            </VStack>
                        </VStack>
                    </Grid>
                </ModalBody>

                <ModalFooter bg="gray.50" _dark={{ bg: "gray.800" }} py={6}>
                    <HStack spacing={4}>
                        <Text fontSize="sm" color="gray.500">
                            Detection ID: {threat.id}
                        </Text>
                        <Button colorScheme="gray" onClick={onClose} size="lg">
                            Close Expanded View
                        </Button>
                    </HStack>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default ExpandThreatModal; 