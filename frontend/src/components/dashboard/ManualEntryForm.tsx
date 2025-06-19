import React, { useState } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Heading,
    VStack,
    HStack,
    FormControl,
    FormLabel,
    Select,
    Input,
    Textarea,
    Button,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useToast,
    Grid,

    Text
} from '@chakra-ui/react';
// Using emojis instead of react-icons to avoid dependency conflicts
import { detectionsAPI, CreateManualDetection } from '../../api/detections';

interface ManualEntryFormProps {
    onSuccess: () => void;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<CreateManualDetection>({
        object_type: '',
        confidence: 0.8,
        location: '',
        description: '',
        officer_name: '',
        notes: '',
        bounding_box: {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        }
    });

    const toast = useToast();

    const weaponTypes = ['Knife', 'Pistol', 'weapon', 'rifle'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.object_type || !formData.location || formData.confidence < 0.1) {
            toast({
                title: 'Validation Error',
                description: 'Please fill in all required fields',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true);
        try {
            const response = await detectionsAPI.createManual(formData);

            toast({
                title: 'Manual Entry Created',
                description: `Detection ID ${response.data.detection_id} created successfully`,
                status: 'success',
                duration: 5000,
                isClosable: true,
            });

            // Reset form
            setFormData({
                object_type: '',
                confidence: 0.8,
                location: '',
                description: '',
                officer_name: '',
                notes: '',
                bounding_box: {
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                }
            });

            onSuccess();
        } catch (error) {
            console.error('Error creating manual entry:', error);
            toast({
                title: 'Error',
                description: 'Failed to create manual detection entry',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <Heading size="md" color="purple.500">
                    👮 Manual Detection Entry
                </Heading>
                <Text fontSize="sm" color="gray.600" mt={1}>
                    For security officers to manually log weapon detections
                </Text>
            </CardHeader>
            <CardBody>
                <form onSubmit={handleSubmit}>
                    <VStack spacing={4} align="stretch">
                        <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
                            {/* Weapon Type */}
                            <FormControl isRequired>
                                <FormLabel>Weapon Type</FormLabel>
                                <Select
                                    placeholder="Select weapon type"
                                    value={formData.object_type}
                                    onChange={(e) => setFormData({ ...formData, object_type: e.target.value })}
                                >
                                    {weaponTypes.map((type) => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Confidence */}
                            <FormControl isRequired>
                                <FormLabel>Confidence Level</FormLabel>
                                <NumberInput
                                    min={0.1}
                                    max={1.0}
                                    step={0.1}
                                    value={formData.confidence}
                                    onChange={(_, value) => setFormData({ ...formData, confidence: value || 0.8 })}
                                >
                                    <NumberInputField />
                                    <NumberInputStepper>
                                        <NumberIncrementStepper />
                                        <NumberDecrementStepper />
                                    </NumberInputStepper>
                                </NumberInput>
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    {Math.round((formData.confidence || 0.8) * 100)}% confidence
                                </Text>
                            </FormControl>

                            {/* Location */}
                            <FormControl isRequired>
                                <FormLabel>Location</FormLabel>
                                <Input
                                    placeholder="e.g., Main Entrance, Building A"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </FormControl>

                            {/* Officer Name */}
                            <FormControl>
                                <FormLabel>Officer Name</FormLabel>
                                <Input
                                    placeholder="Your name"
                                    value={formData.officer_name}
                                    onChange={(e) => setFormData({ ...formData, officer_name: e.target.value })}
                                />
                            </FormControl>
                        </Grid>

                        {/* Description */}
                        <FormControl>
                            <FormLabel>Description</FormLabel>
                            <Textarea
                                placeholder="Describe the situation and weapon detection details..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </FormControl>

                        {/* Bounding Box */}
                        <FormControl>
                            <FormLabel>Detection Area (Optional)</FormLabel>
                            <Grid templateColumns="repeat(4, 1fr)" gap={2}>
                                <VStack spacing={1}>
                                    <Text fontSize="xs" color="gray.500">X</Text>
                                    <NumberInput
                                        size="sm"
                                        min={0}
                                        value={formData.bounding_box?.x || 0}
                                        onChange={(_, value) => setFormData({
                                            ...formData,
                                            bounding_box: { ...formData.bounding_box!, x: value || 0 }
                                        })}
                                    >
                                        <NumberInputField />
                                    </NumberInput>
                                </VStack>
                                <VStack spacing={1}>
                                    <Text fontSize="xs" color="gray.500">Y</Text>
                                    <NumberInput
                                        size="sm"
                                        min={0}
                                        value={formData.bounding_box?.y || 0}
                                        onChange={(_, value) => setFormData({
                                            ...formData,
                                            bounding_box: { ...formData.bounding_box!, y: value || 0 }
                                        })}
                                    >
                                        <NumberInputField />
                                    </NumberInput>
                                </VStack>
                                <VStack spacing={1}>
                                    <Text fontSize="xs" color="gray.500">Width</Text>
                                    <NumberInput
                                        size="sm"
                                        min={1}
                                        value={formData.bounding_box?.width || 100}
                                        onChange={(_, value) => setFormData({
                                            ...formData,
                                            bounding_box: { ...formData.bounding_box!, width: value || 100 }
                                        })}
                                    >
                                        <NumberInputField />
                                    </NumberInput>
                                </VStack>
                                <VStack spacing={1}>
                                    <Text fontSize="xs" color="gray.500">Height</Text>
                                    <NumberInput
                                        size="sm"
                                        min={1}
                                        value={formData.bounding_box?.height || 100}
                                        onChange={(_, value) => setFormData({
                                            ...formData,
                                            bounding_box: { ...formData.bounding_box!, height: value || 100 }
                                        })}
                                    >
                                        <NumberInputField />
                                    </NumberInput>
                                </VStack>
                            </Grid>
                        </FormControl>

                        {/* Notes */}
                        <FormControl>
                            <FormLabel>Additional Notes</FormLabel>
                            <Textarea
                                placeholder="Any additional observations or notes..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={2}
                            />
                        </FormControl>

                        {/* Submit Button */}
                        <HStack justify="flex-end" pt={2}>
                            <Button
                                type="submit"
                                colorScheme="purple"
                                isLoading={loading}
                                loadingText="Creating..."
                                size="lg"
                            >
                                ➕ Create Manual Entry
                            </Button>
                        </HStack>
                    </VStack>
                </form>
            </CardBody>
        </Card>
    );
};

export default ManualEntryForm; 