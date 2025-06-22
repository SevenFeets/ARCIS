import React, { useState, useEffect } from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Badge,
    Text,
    HStack,
    VStack,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Textarea,
    useToast,
    Card,
    CardHeader,
    CardBody,
    Heading,
    Divider,
    Flex,
    Spacer,
    Tooltip,
    Image,
    Spinner,
    Center
} from '@chakra-ui/react';
import { Detection } from '../../api/detections';
import { detectionsAPI } from '../../api/detections';

interface DetectionsListProps {
    detections: Detection[];
    title?: string;
    onRefresh: () => void;
}

const DetectionsList: React.FC<DetectionsListProps> = ({ detections, title = "Recent Detections", onRefresh }) => {
    const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [frameData, setFrameData] = useState<string | null>(null);
    const [loadingFrame, setLoadingFrame] = useState(false);

    const { isOpen, onOpen, onClose } = useDisclosure();
    const toast = useToast();



    const getThreatLevelColor = (level: number) => {
        if (level >= 9) return 'red';
        if (level >= 7) return 'orange';
        if (level >= 5) return 'yellow';
        return 'green';
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

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleString();
    };

    const handleViewDetails = (detection: Detection) => {
        setSelectedDetection(detection);
        setNewComment('');
        setFrameData(null);
        onOpen();
    };

    // Load frame data when modal opens and detection is selected
    useEffect(() => {
        const loadFrameData = async () => {
            if (!selectedDetection || !isOpen) return;

            // Check if detection already has frame data
            if (selectedDetection.detection_frame_data || selectedDetection.frame_data) {
                const frameBase64 = selectedDetection.detection_frame_data || selectedDetection.frame_data;
                // Ensure proper data URL format
                if (frameBase64 && frameBase64.startsWith('data:image')) {
                    setFrameData(frameBase64);
                } else if (frameBase64) {
                    setFrameData(`data:image/png;base64,${frameBase64}`);
                }
                return;
            }

            // Try to fetch frame data from API
            const detectionId = selectedDetection.id || selectedDetection.detection_id;
            if (!detectionId) return;

            setLoadingFrame(true);
            try {
                const response = await detectionsAPI.getDetectionFrame(detectionId);
                if (response.data.frame_data) {
                    const frameBase64 = response.data.frame_data;
                    if (frameBase64.startsWith('data:image')) {
                        setFrameData(frameBase64);
                    } else {
                        setFrameData(`data:image/png;base64,${frameBase64}`);
                    }
                }
            } catch (error) {
                console.log('No frame data available for this detection');
            } finally {
                setLoadingFrame(false);
            }
        };

        loadFrameData();
    }, [selectedDetection, isOpen]);

    const handleAddComment = async () => {
        if (!selectedDetection || !newComment.trim()) return;

        setLoading(true);
        try {
            await detectionsAPI.addComment(selectedDetection.id, newComment.trim());
            toast({
                title: 'Comment Added',
                description: 'Your comment has been added successfully',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setNewComment('');
            onRefresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add comment',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (detectionId: number) => {
        if (!confirm('Are you sure you want to delete this detection?')) return;

        try {
            await detectionsAPI.delete(detectionId);
            toast({
                title: 'Detection Deleted',
                description: 'Detection record has been removed',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            onRefresh();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete detection',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    return (
        <Card>
            <CardHeader>
                <Flex align="center">
                    <Heading size="md">{title}</Heading>
                    <Spacer />
                    <Badge colorScheme="blue" variant="subtle">
                        {detections.length} Records
                    </Badge>
                </Flex>
            </CardHeader>
            <CardBody>
                {detections.length === 0 ? (
                    <Text color="gray.500" textAlign="center" py={8}>
                        No detections found
                    </Text>
                ) : (
                    <Box overflowX="auto">
                        <Table variant="simple" size="md">
                            <Thead>
                                <Tr>
                                    <Th>Type</Th>
                                    <Th>Threat Level</Th>
                                    <Th>Confidence</Th>
                                    <Th>Location</Th>
                                    <Th>Device</Th>
                                    <Th>Time</Th>
                                    <Th>Actions</Th>
                                </Tr>
                            </Thead>
                            <Tbody>
                                {detections.map((detection) => (
                                    <Tr key={detection.id}>
                                        <Td>
                                            <HStack>
                                                <Text fontSize="lg">
                                                    {getWeaponTypeIcon(detection.weapon_type)}
                                                </Text>
                                                <Text fontWeight="medium">
                                                    {detection.weapon_type}
                                                </Text>
                                            </HStack>
                                        </Td>
                                        <Td>
                                            <Badge
                                                colorScheme={getThreatLevelColor(detection.threat_level)}
                                                variant="solid"
                                            >
                                                Level {detection.threat_level}
                                            </Badge>
                                        </Td>
                                        <Td>
                                            <Text fontWeight="semibold">
                                                {detection.confidence}%
                                            </Text>
                                        </Td>
                                        <Td>
                                            <HStack spacing={1}>
                                                <Text fontSize="sm">📍</Text>
                                                <Text fontSize="sm">
                                                    {detection.location || 'Unknown'}
                                                </Text>
                                            </HStack>
                                        </Td>
                                        <Td>
                                            <VStack spacing={0} align="start">
                                                <Text fontSize="sm" fontWeight="medium">
                                                    {detection.device}
                                                </Text>
                                                <Text fontSize="xs" color="gray.500">
                                                    {detection.device_id}
                                                </Text>
                                            </VStack>
                                        </Td>
                                        <Td>
                                            <HStack spacing={1}>
                                                <Text fontSize="sm">🕒</Text>
                                                <Text fontSize="sm">
                                                    {formatTimestamp(detection.timestamp)}
                                                </Text>
                                            </HStack>
                                        </Td>
                                        <Td>
                                            <HStack spacing={2}>
                                                <Tooltip label="View Details">
                                                    <Button
                                                        size="sm"
                                                        colorScheme="blue"
                                                        variant="ghost"
                                                        onClick={() => handleViewDetails(detection)}
                                                    >
                                                        👁️
                                                    </Button>
                                                </Tooltip>
                                                <Tooltip label="Delete">
                                                    <Button
                                                        size="sm"
                                                        colorScheme="red"
                                                        variant="ghost"
                                                        onClick={() => handleDelete(detection.id)}
                                                    >
                                                        🗑️
                                                    </Button>
                                                </Tooltip>
                                            </HStack>
                                        </Td>
                                    </Tr>
                                ))}
                            </Tbody>
                        </Table>
                    </Box>
                )}
            </CardBody>

            {/* Detection Details Modal */}
            <Modal isOpen={isOpen} onClose={onClose} size="xl">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>
                        Detection Details - ID {selectedDetection?.id}
                    </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        {selectedDetection && (
                            <VStack spacing={4} align="stretch">
                                {/* Detection Frame Image */}
                                {(frameData || loadingFrame) && (
                                    <Box>
                                        <Heading size="sm" mb={2}>🖼️ Detection Frame</Heading>
                                        {loadingFrame ? (
                                            <Center p={4}>
                                                <VStack>
                                                    <Spinner size="lg" />
                                                    <Text fontSize="sm" color="gray.500">Loading frame...</Text>
                                                </VStack>
                                            </Center>
                                        ) : frameData ? (
                                            <Box
                                                border="2px solid"
                                                borderColor="gray.200"
                                                borderRadius="md"
                                                overflow="hidden"
                                                maxW="100%"
                                            >
                                                <Image
                                                    src={frameData}
                                                    alt="Detection Frame"
                                                    maxW="100%"
                                                    maxH="400px"
                                                    objectFit="contain"
                                                    fallback={
                                                        <Center p={8}>
                                                            <Text color="gray.500">Failed to load image</Text>
                                                        </Center>
                                                    }
                                                />
                                            </Box>
                                        ) : null}
                                    </Box>
                                )}

                                {frameData && <Divider />}

                                {/* Basic Info */}
                                <Box>
                                    <Heading size="sm" mb={2}>Basic Information</Heading>
                                    <VStack spacing={2} align="stretch">
                                        <HStack>
                                            <Text fontWeight="bold" minW="120px">Weapon Type:</Text>
                                            <Text>{getWeaponTypeIcon(selectedDetection.weapon_type)} {selectedDetection.weapon_type}</Text>
                                        </HStack>
                                        <HStack>
                                            <Text fontWeight="bold" minW="120px">Threat Level:</Text>
                                            <Badge colorScheme={getThreatLevelColor(selectedDetection.threat_level)}>
                                                Level {selectedDetection.threat_level}
                                            </Badge>
                                        </HStack>
                                        <HStack>
                                            <Text fontWeight="bold" minW="120px">Confidence:</Text>
                                            <Text>{selectedDetection.confidence}%</Text>
                                        </HStack>
                                        <HStack>
                                            <Text fontWeight="bold" minW="120px">Location:</Text>
                                            <Text>📍 {selectedDetection.location}</Text>
                                        </HStack>
                                        <HStack>
                                            <Text fontWeight="bold" minW="120px">Device:</Text>
                                            <Text>{selectedDetection.device} ({selectedDetection.device_id})</Text>
                                        </HStack>
                                        <HStack>
                                            <Text fontWeight="bold" minW="120px">Detected:</Text>
                                            <Text>🕒 {formatTimestamp(selectedDetection.timestamp)}</Text>
                                        </HStack>
                                    </VStack>
                                </Box>

                                <Divider />

                                {/* Bounding Box */}
                                <Box>
                                    <Heading size="sm" mb={2}>Detection Area</Heading>
                                    <Text fontSize="sm" color="gray.600">
                                        Bounding Box: {selectedDetection.bounding_box.x}, {selectedDetection.bounding_box.y},
                                        {selectedDetection.bounding_box.width}×{selectedDetection.bounding_box.height}
                                    </Text>
                                </Box>

                                <Divider />

                                {/* Comments */}
                                <Box>
                                    <Heading size="sm" mb={2}>💬 Comments ({selectedDetection.comments.length})</Heading>
                                    <VStack spacing={2} align="stretch" mb={3}>
                                        {selectedDetection.comments.map((comment) => (
                                            <Box key={comment.id} p={3} bg="gray.50" borderRadius="md">
                                                <Text fontSize="sm">{comment.comment}</Text>
                                                <Text fontSize="xs" color="gray.500" mt={1}>
                                                    by {comment.user_name} • {formatTimestamp(comment.timestamp)}
                                                </Text>
                                            </Box>
                                        ))}
                                    </VStack>

                                    <VStack spacing={3}>
                                        <Textarea
                                            placeholder="Add a comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            size="sm"
                                        />
                                        <Button
                                            colorScheme="blue"
                                            size="sm"
                                            onClick={handleAddComment}
                                            isLoading={loading}
                                            isDisabled={!newComment.trim()}
                                            alignSelf="flex-end"
                                        >
                                            💬 Add Comment
                                        </Button>
                                    </VStack>
                                </Box>
                            </VStack>
                        )}
                    </ModalBody>
                    <ModalFooter>
                        <Button onClick={onClose}>Close</Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Card>
    );
};

export default DetectionsList; 