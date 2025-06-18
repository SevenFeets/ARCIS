import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    SimpleGrid,
    Card,
    CardBody,
    CardHeader,
    Badge,
    HStack,
    Button,
    Icon
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { FiArrowLeft, FiCpu, FiCamera, FiWifi, FiDatabase, FiShield, FiMonitor } from 'react-icons/fi';

const ProjectOverviewPage = () => {
    return (
        <Container maxW="container.xl" py={8}>
            {/* Header */}
            <VStack spacing={6} mb={12} textAlign="center">
                <Button
                    as={RouterLink}
                    to="/"
                    leftIcon={<FiArrowLeft />}
                    variant="ghost"
                    alignSelf="flex-start"
                >
                    Back to Home
                </Button>

                <Heading as="h1" size="2xl" color="blue.500">
                    🛡️ ARCIS Project Overview
                </Heading>
                <Text fontSize="xl" maxW="container.md" color="gray.600">
                    Autonomous Real-time Critical Infrastructure Security System
                </Text>
                <Badge colorScheme="green" px={4} py={2} fontSize="md">
                    AI-Powered Weapon Detection Platform
                </Badge>
            </VStack>

            {/* Project Description */}
            <Box mb={12}>
                <Card>
                    <CardHeader>
                        <Heading size="lg">🎯 Project Mission</Heading>
                    </CardHeader>
                    <CardBody>
                        <Text fontSize="lg" lineHeight={1.8}>
                            ARCIS is an intelligent security system designed to detect weapons and threats in real-time
                            using computer vision and machine learning. The system processes live video feeds from
                            multiple camera sources, analyzes them for potential threats, and provides immediate alerts
                            to security personnel through a comprehensive dashboard interface.
                        </Text>
                    </CardBody>
                </Card>
            </Box>

            {/* System Architecture */}
            <Box mb={12}>
                <Heading size="xl" mb={6} textAlign="center">
                    🏗️ System Architecture
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                    <Card>
                        <CardHeader>
                            <HStack>
                                <Icon as={FiCamera} color="blue.500" boxSize={6} />
                                <Heading size="md">Detection Layer</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <Text><strong>Camera Sources:</strong> Jetson Nano & Raspberry Pi</Text>
                                <Text><strong>AI Models:</strong> YOLO-based weapon detection</Text>
                                <Text><strong>Processing:</strong> Real-time video analysis</Text>
                                <Badge colorScheme="blue">Edge Computing</Badge>
                            </VStack>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <HStack>
                                <Icon as={FiDatabase} color="green.500" boxSize={6} />
                                <Heading size="md">Backend System</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <Text><strong>Database:</strong> PostgreSQL</Text>
                                <Text><strong>API:</strong> RESTful Node.js</Text>
                                <Text><strong>Storage:</strong> Detection frames & metrics</Text>
                                <Badge colorScheme="green">Cloud Infrastructure</Badge>
                            </VStack>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <HStack>
                                <Icon as={FiMonitor} color="purple.500" boxSize={6} />
                                <Heading size="md">Frontend Dashboard</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <Text><strong>Interface:</strong> React + TypeScript</Text>
                                <Text><strong>Features:</strong> Real-time monitoring</Text>
                                <Text><strong>Alerts:</strong> Instant threat notifications</Text>
                                <Badge colorScheme="purple">User Experience</Badge>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>

            {/* Key Technologies */}
            <Box mb={12}>
                <Heading size="xl" mb={6} textAlign="center">
                    ⚙️ Core Technologies
                </Heading>
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
                    <Card>
                        <CardHeader>
                            <HStack>
                                <Icon as={FiCpu} color="orange.500" boxSize={6} />
                                <Heading size="md">AI & Machine Learning</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <Text>• <strong>Computer Vision:</strong> OpenCV for image processing</Text>
                                <Text>• <strong>Object Detection:</strong> YOLO (You Only Look Once)</Text>
                                <Text>• <strong>Deep Learning:</strong> Neural networks for weapon classification</Text>
                                <Text>• <strong>Real-time Processing:</strong> Optimized for edge devices</Text>
                            </VStack>
                        </CardBody>
                    </Card>

                    <Card>
                        <CardHeader>
                            <HStack>
                                <Icon as={FiWifi} color="cyan.500" boxSize={6} />
                                <Heading size="md">Communication & Integration</Heading>
                            </HStack>
                        </CardHeader>
                        <CardBody>
                            <VStack align="start" spacing={3}>
                                <Text>• <strong>IoT Integration:</strong> Seamless device connectivity</Text>
                                <Text>• <strong>RESTful APIs:</strong> Standardized communication</Text>
                                <Text>• <strong>Real-time Updates:</strong> Live data synchronization</Text>
                                <Text>• <strong>Cloud Deployment:</strong> Scalable infrastructure</Text>
                            </VStack>
                        </CardBody>
                    </Card>
                </SimpleGrid>
            </Box>

            {/* Security Features */}
            <Box mb={12}>
                <Card bg="red.50" _dark={{ bg: "red.900", opacity: 0.3 }}>
                    <CardHeader>
                        <HStack>
                            <Icon as={FiShield} color="red.500" boxSize={6} />
                            <Heading size="lg" color="red.600" _dark={{ color: "red.300" }}>
                                🚨 Security & Safety Features
                            </Heading>
                        </HStack>
                    </CardHeader>
                    <CardBody>
                        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                            <VStack align="start" spacing={3}>
                                <Text><strong>🎯 Threat Detection:</strong> Automatic weapon identification</Text>
                                <Text><strong>📊 Confidence Scoring:</strong> Accuracy assessment for each detection</Text>
                                <Text><strong>⚡ Real-time Alerts:</strong> Immediate notification system</Text>
                            </VStack>
                            <VStack align="start" spacing={3}>
                                <Text><strong>📸 Evidence Capture:</strong> Automatic frame storage</Text>
                                <Text><strong>📍 Location Tracking:</strong> Precise threat positioning</Text>
                                <Text><strong>👮 Manual Override:</strong> Security officer input capability</Text>
                            </VStack>
                        </SimpleGrid>
                    </CardBody>
                </Card>
            </Box>

            {/* Call to Action */}
            <Box textAlign="center">
                <VStack spacing={4}>
                    <Heading size="lg">Ready to Experience ARCIS?</Heading>
                    <Text fontSize="lg" color="gray.600">
                        Explore the live dashboard and see the system in action
                    </Text>
                    <HStack spacing={4}>
                        <Button
                            as={RouterLink}
                            to="/auth?from=project-overview&action=get-started"
                            colorScheme="blue"
                            size="lg"
                        >
                            🛡️ View Dashboard
                        </Button>
                        <Button
                            as={RouterLink}
                            to="/about"
                            variant="outline"
                            size="lg"
                        >
                            Learn More Details
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Container>
    );
};

export default ProjectOverviewPage; 