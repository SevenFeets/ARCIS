import {
    Box,
    Container,
    Heading,
    Text,
    Button,
    Flex,
    Tab,
    TabList,
    TabPanel,
    TabPanels,
    Tabs,
    Alert,
    AlertIcon,
    AlertDescription
} from '@chakra-ui/react'
import { FormControl, FormLabel } from '@chakra-ui/form-control'
import { Input } from '@chakra-ui/input'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '@chakra-ui/react'

const AuthPage = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [showWarning, setShowWarning] = useState(false)
    const [warningMessage, setWarningMessage] = useState('')

    // Check if user is coming from other pages
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search)
        const from = searchParams.get('from')
        const action = searchParams.get('action')

        if (from === 'project-overview' && action === 'get-started') {
            setShowWarning(true)
            setWarningMessage('To view the dashboard, please sign up first!')
        } else if (from === 'home' && action === 'get-started') {
            setShowWarning(true)
            setWarningMessage('Ready to get started? Create your account to access ARCIS!')
        } else if (from === 'home' && action === 'view-dashboard') {
            setShowWarning(true)
            setWarningMessage('Sign up or log in to access the live dashboard!')
        }
    }, [location])

    // Redirect if already logged in
    useEffect(() => {
        if (currentUser) {
            navigate('/dashboard')
        }
    }, [currentUser, navigate])

    return (
        <Container maxW="container.md" py={8}>
            {/* Header */}
            <Box textAlign="center" mb={8}>
                <Button
                    as={RouterLink}
                    to="/"
                    variant="ghost"
                    mb={4}
                    alignSelf="flex-start"
                >
                    ← Back to Home
                </Button>
                <Heading as="h1" size="xl" mb={4}>
                    Access Your Account
                </Heading>
                <Text fontSize="lg" color="gray.600">
                    Sign in to your existing account or create a new one
                </Text>
            </Box>

            {/* Warning Alert */}
            {showWarning && (
                <Alert status="warning" mb={6} borderRadius="md">
                    <AlertIcon />
                    <AlertDescription>{warningMessage}</AlertDescription>
                </Alert>
            )}

            {/* Authentication Forms */}
            <Box maxWidth="500px" mx="auto" bg="white" _dark={{ bg: 'gray.800' }} borderRadius="lg" shadow="lg" p={6}>
                <Tabs variant="enclosed" colorScheme="blue" isFitted defaultIndex={showWarning ? 1 : 0}>
                    <TabList>
                        <Tab>Sign In</Tab>
                        <Tab>Sign Up</Tab>
                    </TabList>

                    <TabPanels>
                        <TabPanel>
                            <Box pt={4}>
                                <LoginForm />
                            </Box>
                        </TabPanel>

                        <TabPanel>
                            <Box pt={4}>
                                <RegisterForm />
                            </Box>
                        </TabPanel>
                    </TabPanels>
                </Tabs>
            </Box>

            {/* Additional Info */}
            <Box textAlign="center" mt={8}>
                <Text color="gray.600">
                    Need help? <Button as={RouterLink} to="/contact" variant="link" colorScheme="blue">Contact us</Button>
                </Text>
            </Box>
        </Container>
    )
}

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { login } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !password) {
            toast({
                title: "Error",
                description: "Please enter both email and password",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
            return
        }

        try {
            setIsLoading(true)
            await login(email, password)
            toast({
                title: "Success",
                description: "You've been logged in successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            })
            navigate('/dashboard')
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to log in. Please check your credentials.",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleLogin}>
            <Flex direction="column" gap={4}>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                </FormControl>
                <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    mt={2}
                    isLoading={isLoading}
                    loadingText="Signing in..."
                >
                    Sign In
                </Button>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                    Don't have an account? Switch to the Sign Up tab above.
                </Text>
            </Flex>
        </form>
    )
}

function RegisterForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { signup } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()

    const isValidEmailDomain = (email: string) => {
        const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'mail.com']
        const domain = email.split('@')[1]
        return validDomains.includes(domain)
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !email || !password || !confirmPassword) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
            return
        }

        if (!isValidEmailDomain(email)) {
            toast({
                title: "Error",
                description: "Please use a valid email domain (gmail.com, yahoo.com, etc.)",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
            return
        }

        if (password !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
            return
        }

        try {
            setIsLoading(true)
            await signup(email, password)
            toast({
                title: "Success",
                description: "Account created successfully! Welcome to ARCIS.",
                status: "success",
                duration: 5000,
                isClosable: true,
            })
            navigate('/dashboard')
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create account. Please try again.",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleRegister}>
            <Flex direction="column" gap={4}>
                <FormControl isRequired>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                        placeholder="Your full name"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                        type="password"
                        placeholder="********"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                </FormControl>
                <FormControl isRequired>
                    <FormLabel>Confirm Password</FormLabel>
                    <Input
                        type="password"
                        placeholder="********"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    />
                </FormControl>
                <Button
                    type="submit"
                    colorScheme="blue"
                    width="full"
                    mt={2}
                    isLoading={isLoading}
                    loadingText="Creating account..."
                >
                    Create Account
                </Button>
                <Text fontSize="sm" color="gray.600" textAlign="center">
                    Already have an account? Switch to the Sign In tab above.
                </Text>
            </Flex>
        </form>
    )
}

export default AuthPage 