import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    HStack,
    VStack,
    SimpleGrid,
    Card,
    CardBody,
    CardHeader,
    CardFooter,
    Flex,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs
} from '@chakra-ui/react'

import { Link as RouterLink } from 'react-router-dom'

const HomePage = () => {
    return (
        <Box>
            {/* Hero Section */}
            <Box py={20} textAlign="center">
                <Container maxW="container.lg">
                    <Flex direction="column" align="center" gap={6}>
                        <Heading as="h1" size="2xl" mb={4}>
                            Eagle Sight Technology
                        </Heading>
                        <Text fontSize="xl" maxW="container.md" mx="auto" mb={8} lineHeight={1.8}>
                            ARCIS (Autonomous Real-time Critical Infrastructure Security) is an advanced AI-powered weapon detection system
                            that uses computer vision and machine learning to identify threats in real-time. Our intelligent platform processes
                            live video feeds from multiple camera sources, providing instant alerts to security personnel through a comprehensive
                            dashboard interface. Built with cutting-edge technology including YOLO object detection, IoT integration, and cloud
                            infrastructure, ARCIS revolutionizes security monitoring for critical facilities and public spaces.
                        </Text>
                        <HStack gap={4} justify="center">
                            <Button
                                as={RouterLink}
                                to="/auth?from=home&action=get-started"
                                colorScheme="blue"
                                size="lg"
                                _hover={{
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'lg'
                                }}
                            >
                                🚀 Get Started
                            </Button>
                            <Button
                                as={RouterLink}
                                to="/articles"
                                variant="outline"
                                size="lg"
                                _hover={{
                                    bg: 'green.500',
                                    color: 'white',
                                    borderColor: 'green.500',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'lg'
                                }}
                            >
                                📚 Learn More
                            </Button>
                        </HStack>
                    </Flex>
                </Container>
            </Box>

            {/* Features Section */}
            <Box py={16} bg="gray.50" _dark={{ bg: 'gray.900' }}>
                <Container maxW="container.lg">
                    <Heading textAlign="center" mb={12}>
                        Key Features
                    </Heading>
                    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10}>
                        {[
                            {
                                title: '🎯 AI-Powered Detection',
                                description: 'Advanced YOLO-based computer vision algorithms detect weapons and threats in real-time with high accuracy and minimal false positives.'
                            },
                            {
                                title: '⚡ Real-time Monitoring',
                                description: 'Live video feed processing from multiple camera sources with instant alert notifications to security personnel and emergency responders.'
                            },
                            {
                                title: '📊 Comprehensive Dashboard',
                                description: 'Intuitive web interface displaying threat analytics, system metrics, device status, and historical detection data with interactive visualizations.'
                            },
                        ].map((feature, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <Heading size="md">{feature.title}</Heading>
                                </CardHeader>
                                <CardBody>
                                    <Text>{feature.description}</Text>
                                </CardBody>
                                <CardFooter>
                                    <Button
                                        as={RouterLink}
                                        to="/project-overview"
                                        variant="ghost"
                                        colorScheme="blue"
                                        _hover={{
                                            bg: 'blue.50',
                                            transform: 'translateY(-1px)'
                                        }}
                                    >
                                        Learn more →
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Call to Action */}
            <Box py={16} textAlign="center">
                <Container maxW="container.md">
                    <Heading mb={4}>🛡️ Secure Your Facility with ARCIS</Heading>
                    <Text fontSize="lg" mb={8}>
                        Experience the future of intelligent security monitoring. Join security professionals who trust ARCIS for critical infrastructure protection.
                    </Text>
                    <Button
                        as={RouterLink}
                        to="/auth?from=home&action=view-dashboard"
                        colorScheme="blue"
                        size="lg"
                        _hover={{
                            transform: 'translateY(-2px)',
                            boxShadow: 'xl'
                        }}
                    >
                        🚀 View Live Dashboard
                    </Button>
                </Container>
            </Box>

            {/* Access Account Area */}
            <Box py={16} bg="gray.50" _dark={{ bg: 'gray.900' }}>
                <Container maxW="container.md">
                    <Heading mb={8} textAlign="center">Access Your Account</Heading>
                    <AccessAccountArea />
                </Container>
            </Box>


        </Box>
    )
}

function AccessAccountArea() {
    return (
        <Box p={6} maxWidth="500px" mx="auto" bg="white" _dark={{ bg: 'gray.800' }} borderRadius="lg" shadow="md">
            <Tabs variant="enclosed" colorScheme="blue" isFitted>
                <TabList>
                    <Tab>Quick Access</Tab>
                    <Tab>Access to Account</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        {/* Quick information */}
                        <Box pt={4} textAlign="center">
                            <Text mb={4} color="gray.600">
                                Get quick access to ARCIS features
                            </Text>
                            <VStack spacing={3}>
                                <Button
                                    as={RouterLink}
                                    to="/project-overview"
                                    colorScheme="blue"
                                    size="lg"
                                    width="full"
                                >
                                    📋 View Project Overview
                                </Button>
                                <Button
                                    as={RouterLink}
                                    to="/about"
                                    variant="outline"
                                    size="lg"
                                    width="full"
                                >
                                    ℹ️ Learn About ARCIS
                                </Button>
                            </VStack>
                        </Box>
                    </TabPanel>

                    <TabPanel>
                        {/* Account access */}
                        <Box pt={4} textAlign="center">
                            <Text mb={4} color="gray.600">
                                Sign in to your account or create a new one to access the dashboard
                            </Text>
                            <VStack spacing={3}>
                                <Button
                                    as={RouterLink}
                                    to="/auth"
                                    colorScheme="green"
                                    size="lg"
                                    width="full"
                                >
                                    🔐 Sign In / Sign Up
                                </Button>
                                <Text fontSize="sm" color="gray.500">
                                    Already have an account? Click above to sign in.
                                    <br />
                                    New to ARCIS? Create your account in seconds.
                                </Text>
                            </VStack>
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    )
}



export default HomePage 