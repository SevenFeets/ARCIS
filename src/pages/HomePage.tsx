import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    HStack,
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
    Tabs,
    Image
} from '@chakra-ui/react'
import { FormControl, FormLabel } from '@chakra-ui/form-control'
import { Input } from '@chakra-ui/input'

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
                        <Text fontSize="xl" maxW="container.md" mx="auto" mb={8}>
                            This is a brief description of your final graduate project. Explain what it does and why it matters.
                        </Text>
                        <HStack gap={4} justify="center">
                            <Button colorScheme="blue" size="lg">
                                Get Started
                            </Button>
                            <Button variant="outline" size="lg">
                                Learn More
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
                            { title: 'Feature 1', description: 'Description of feature 1' },
                            { title: 'Feature 2', description: 'Description of feature 2' },
                            { title: 'Feature 3', description: 'Description of feature 3' },
                        ].map((feature, index) => (
                            <Card key={index}>
                                <CardHeader>
                                    <Heading size="md">{feature.title}</Heading>
                                </CardHeader>
                                <CardBody>
                                    <Text>{feature.description}</Text>
                                </CardBody>
                                <CardFooter>
                                    <Button variant="ghost">Learn more</Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </SimpleGrid>
                </Container>
            </Box>

            {/* Call to Action */}
            <Box py={16} textAlign="center">
                <Container maxW="container.md">
                    <Heading mb={4}>Ready to Get Started?</Heading>
                    <Text fontSize="lg" mb={8}>
                        Join thousands of users who are already benefiting from our platform.
                    </Text>
                    <Button colorScheme="blue" size="lg">
                        Sign Up Now
                    </Button>
                </Container>
            </Box>

            {/* Login Area */}
            <Box py={16} bg="gray.50" _dark={{ bg: 'gray.900' }}>
                <Container maxW="container.md">
                    <Heading mb={8} textAlign="center">Access Your Account</Heading>
                    <LoginArea />
                </Container>
            </Box>
        </Box>
    )
}

function LoginArea() {
    return (
        <Box p={4} maxWidth="500px" mx="auto" bg="white" _dark={{ bg: 'gray.800' }} borderRadius="lg" shadow="md">
            <Tabs variant="enclosed" colorScheme="blue" isFitted>
                <TabList>
                    <Tab>Login</Tab>
                    <Tab>Register</Tab>
                </TabList>

                <TabPanels>
                    <TabPanel>
                        {/* Login form content */}
                        <Box pt={4}>
                            <LoginForm />
                        </Box>
                    </TabPanel>

                    <TabPanel>
                        {/* Registration form content */}
                        <Box pt={4}>
                            <RegisterForm />
                        </Box>
                    </TabPanel>
                </TabPanels>
            </Tabs>
        </Box>
    )
}

function LoginForm() {
    return (
        <Flex direction="column" gap={4}>
            <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" placeholder="your.email@example.com" />
            </FormControl>
            <FormControl>
                <FormLabel>Password</FormLabel>
                <Input type="password" placeholder="********" />
            </FormControl>
            <Button colorScheme="blue" width="full" mt={2}>
                Login
            </Button>
        </Flex>
    )
}

function RegisterForm() {
    return (
        <Flex direction="column" gap={4}>
            <FormControl>
                <FormLabel>Name</FormLabel>
                <Input placeholder="Your name" />
            </FormControl>
            <FormControl>
                <FormLabel>Email</FormLabel>
                <Input type="email" placeholder="your.email@example.com" />
            </FormControl>
            <FormControl>
                <FormLabel>Password</FormLabel>
                <Input type="password" placeholder="********" />
            </FormControl>
            <FormControl>
                <FormLabel>Confirm Password</FormLabel>
                <Input type="password" placeholder="********" />
            </FormControl>
            <Button colorScheme="blue" width="full" mt={2}>
                Register
            </Button>
        </Flex>
    )
}

export default HomePage 