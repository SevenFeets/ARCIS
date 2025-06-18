import React, { useState } from 'react';
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
    Heading,
    Grid,
    Select,
    Textarea,
    Input,
    FormControl,
    FormLabel,
    useToast,
    Divider,
    Image
} from '@chakra-ui/react';
import {
    useDetectionTest,
    useAllDetections,
    useThreats,
    useDetectionsByWeaponType,
    useManualDetections,
    useDetectionById,
    useCreateManualDetection,
    useAddComment,
    useDeleteDetection,
    useDetectionMetrics,
    useDetectionFrame
} from '../../hooks/useDetections';

const DetectionHooksTest: React.FC = () => {
    const [selectedWeaponType, setSelectedWeaponType] = useState<string>('');
    const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
    const [commentText, setCommentText] = useState<string>('');
    const [manualFormData, setManualFormData] = useState({
        object_type: '',
        confidence: 0.8,
        location: '',
        description: '',
        officer_name: ''
    });

    const toast = useToast();

    // Initialize all hooks
    const dbTest = useDetectionTest();
    const allDetections = useAllDetections(false); // Don't auto-fetch
    const threats = useThreats(false);
    const weaponDetections = useDetectionsByWeaponType(selectedWeaponType, false);
    const manualDetections = useManualDetections(false);
    const detectionById = useDetectionById(selectedDetectionId, false);
    const createManual = useCreateManualDetection();
    const addComment = useAddComment();
    const deleteDetection = useDeleteDetection();
    const metrics = useDetectionMetrics(selectedDetectionId, false);
    const frame = useDetectionFrame(selectedDetectionId, false);

    const weaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];

    const handleCreateManual = async () => {
        if (!manualFormData.object_type || !manualFormData.location) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in weapon type and location',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            await createManual.createManualDetection(manualFormData);
            toast({
                title: 'Success',
                description: 'Manual detection created',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            // Reset form
            setManualFormData({
                object_type: '',
                confidence: 0.8,
                location: '',
                description: '',
                officer_name: ''
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create manual detection',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleAddComment = async () => {
        if (!selectedDetectionId || !commentText.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please select a detection and enter a comment',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            await addComment.addComment(selectedDetectionId, commentText.trim());
            toast({
                title: 'Success',
                description: 'Comment added',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setCommentText('');
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to add comment',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedDetectionId) {
            toast({
                title: 'Validation Error',
                description: 'Please select a detection to delete',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!confirm(`Are you sure you want to delete detection ${selectedDetectionId}?`)) {
            return;
        }

        try {
            await deleteDetection.deleteDetection(selectedDetectionId);
            toast({
                title: 'Success',
                description: 'Detection deleted',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            setSelectedDetectionId(null);
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
        <Box p={6} maxW="1200px" mx="auto">
            <Heading size="lg" mb={6} textAlign="center">🧪 Detection Hooks Test Suite</Heading>

            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                {/* GET Endpoints */}
                <VStack spacing={4} align="stretch">
                    <Heading size="md" color="blue.500">📥 GET Endpoints</Heading>

                    {/* Database Test */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">🗄️ Database Test</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Button
                                    onClick={dbTest.testConnection}
                                    isLoading={dbTest.loading}
                                    colorScheme="blue"
                                    size="sm"
                                    width="full"
                                >
                                    Test Connection
                                </Button>
                                {dbTest.error && <Text color="red.500" fontSize="sm">{dbTest.error}</Text>}
                                {dbTest.data && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ {dbTest.data.message} - {dbTest.totalDetections} total detections
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* All Detections */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">📋 All Detections</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Button
                                    onClick={allDetections.refetch}
                                    isLoading={allDetections.loading}
                                    colorScheme="green"
                                    size="sm"
                                    width="full"
                                >
                                    Fetch All Detections
                                </Button>
                                {allDetections.error && <Text color="red.500" fontSize="sm">{allDetections.error}</Text>}
                                {allDetections.detections.length > 0 && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Found {allDetections.detections.length} detections
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Threats */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">⚠️ High Priority Threats</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Button
                                    onClick={threats.refetch}
                                    isLoading={threats.loading}
                                    colorScheme="red"
                                    size="sm"
                                    width="full"
                                >
                                    Fetch Threats
                                </Button>
                                {threats.error && <Text color="red.500" fontSize="sm">{threats.error}</Text>}
                                {threats.hasThreats && (
                                    <Text fontSize="sm" color="red.500">
                                        ⚠️ {threats.threatCount} active threats detected
                                    </Text>
                                )}
                                {!threats.hasThreats && threats.threatCount === 0 && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ No active threats
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Weapon Type Filter */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">🔫 Filter by Weapon Type</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Select
                                    placeholder="Select weapon type"
                                    value={selectedWeaponType}
                                    onChange={(e) => setSelectedWeaponType(e.target.value)}
                                    size="sm"
                                >
                                    {weaponTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </Select>
                                <Button
                                    onClick={() => weaponDetections.refetch()}
                                    isLoading={weaponDetections.loading}
                                    colorScheme="orange"
                                    size="sm"
                                    width="full"
                                    isDisabled={!selectedWeaponType}
                                >
                                    Fetch by Type
                                </Button>
                                {weaponDetections.error && <Text color="red.500" fontSize="sm">{weaponDetections.error}</Text>}
                                {weaponDetections.hasDetections && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Found {weaponDetections.count} {selectedWeaponType} detections
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Manual Detections */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">👮 Manual Detections</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Button
                                    onClick={manualDetections.refetch}
                                    isLoading={manualDetections.loading}
                                    colorScheme="purple"
                                    size="sm"
                                    width="full"
                                >
                                    Fetch Manual Entries
                                </Button>
                                {manualDetections.error && <Text color="red.500" fontSize="sm">{manualDetections.error}</Text>}
                                {manualDetections.hasEntries && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Found {manualDetections.count} manual entries
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>

                {/* POST, PUT, DELETE Endpoints */}
                <VStack spacing={4} align="stretch">
                    <Heading size="md" color="orange.500">📤 POST/PUT/DELETE Endpoints</Heading>

                    {/* Detection ID Selection */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">🎯 Select Detection ID</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Input
                                    type="number"
                                    placeholder="Enter detection ID"
                                    value={selectedDetectionId || ''}
                                    onChange={(e) => setSelectedDetectionId(e.target.value ? parseInt(e.target.value) : null)}
                                    size="sm"
                                />
                                <HStack width="full">
                                    <Button
                                        onClick={() => detectionById.refetch()}
                                        isLoading={detectionById.loading}
                                        colorScheme="teal"
                                        size="sm"
                                        flex={1}
                                        isDisabled={!selectedDetectionId}
                                    >
                                        Get Details
                                    </Button>
                                    <Button
                                        onClick={() => frame.refetch()}
                                        isLoading={frame.loading}
                                        colorScheme="pink"
                                        size="sm"
                                        flex={1}
                                        isDisabled={!selectedDetectionId}
                                    >
                                        Get Frame
                                    </Button>
                                </HStack>
                                {detectionById.detection && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Found: {detectionById.detection.weapon_type} - {detectionById.detection.confidence}%
                                    </Text>
                                )}
                                {frame.hasFrame && (
                                    <Image
                                        src={frame.frameDataUri!}
                                        alt="Detection Frame"
                                        maxH="150px"
                                        objectFit="contain"
                                        border="1px solid"
                                        borderColor="gray.200"
                                    />
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Create Manual Detection */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">➕ Create Manual Detection</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Select
                                    placeholder="Weapon type"
                                    value={manualFormData.object_type}
                                    onChange={(e) => setManualFormData({ ...manualFormData, object_type: e.target.value })}
                                    size="sm"
                                >
                                    {weaponTypes.map((type) => (
                                        <option key={type} value={type}>{type}</option>
                                    ))}
                                </Select>
                                <Input
                                    placeholder="Location"
                                    value={manualFormData.location}
                                    onChange={(e) => setManualFormData({ ...manualFormData, location: e.target.value })}
                                    size="sm"
                                />
                                <Input
                                    placeholder="Officer name"
                                    value={manualFormData.officer_name}
                                    onChange={(e) => setManualFormData({ ...manualFormData, officer_name: e.target.value })}
                                    size="sm"
                                />
                                <Button
                                    onClick={handleCreateManual}
                                    isLoading={createManual.loading}
                                    colorScheme="green"
                                    size="sm"
                                    width="full"
                                >
                                    Create Manual Entry
                                </Button>
                                {createManual.success && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Created detection ID: {createManual.lastCreated?.detection_id}
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Add Comment */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">💬 Add Comment</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Textarea
                                    placeholder="Enter comment..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    size="sm"
                                    rows={3}
                                />
                                <Button
                                    onClick={handleAddComment}
                                    isLoading={addComment.loading}
                                    colorScheme="blue"
                                    size="sm"
                                    width="full"
                                    isDisabled={!selectedDetectionId || !commentText.trim()}
                                >
                                    Add Comment
                                </Button>
                                {addComment.success && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Comment added successfully
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>

                    {/* Delete Detection */}
                    <Card>
                        <CardHeader>
                            <Heading size="sm">🗑️ Delete Detection</Heading>
                        </CardHeader>
                        <CardBody>
                            <VStack spacing={3}>
                                <Button
                                    onClick={handleDelete}
                                    isLoading={deleteDetection.loading}
                                    colorScheme="red"
                                    size="sm"
                                    width="full"
                                    isDisabled={!selectedDetectionId}
                                >
                                    Delete Detection
                                </Button>
                                {deleteDetection.success && (
                                    <Text fontSize="sm" color="green.500">
                                        ✅ Detection {deleteDetection.deletedDetection?.id} deleted
                                    </Text>
                                )}
                            </VStack>
                        </CardBody>
                    </Card>
                </VStack>
            </Grid>

            {/* Status Summary */}
            <Card mt={6}>
                <CardHeader>
                    <Heading size="sm">📊 Hook Status Summary</Heading>
                </CardHeader>
                <CardBody>
                    <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={2}>
                        <HStack>
                            <Badge colorScheme={dbTest.isHealthy ? 'green' : 'red'}>DB Test</Badge>
                            <Text fontSize="xs">{dbTest.loading ? 'Loading...' : dbTest.isHealthy ? 'Healthy' : 'Error'}</Text>
                        </HStack>
                        <HStack>
                            <Badge colorScheme={allDetections.hasDetections ? 'green' : 'gray'}>All Detections</Badge>
                            <Text fontSize="xs">{allDetections.detections.length} items</Text>
                        </HStack>
                        <HStack>
                            <Badge colorScheme={threats.isCritical ? 'red' : 'green'}>Threats</Badge>
                            <Text fontSize="xs">{threats.threatCount} active</Text>
                        </HStack>
                        <HStack>
                            <Badge colorScheme={manualDetections.hasEntries ? 'purple' : 'gray'}>Manual</Badge>
                            <Text fontSize="xs">{manualDetections.count} entries</Text>
                        </HStack>
                    </Grid>
                </CardBody>
            </Card>
        </Box>
    );
};

export default DetectionHooksTest; 