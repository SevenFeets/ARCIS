import {
    Box,
    Button,
    Text,
    Link,
    HStack,
    Divider,
    FormControl,
    FormLabel,
    Input,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    useToast,
    Flex
} from '@chakra-ui/react'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithGoogle, signup } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();
    const [isLoginView, setIsLoginView] = useState(true)
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleLogin = async () => {
        if (!email || !password) {
            toast({
                title: "Error",
                description: "Please enter both email and password",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setIsLoading(true);
            await login(email, password);
            toast({
                title: "Success",
                description: "You've been logged in",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onClose();
            navigate('/profile');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to log in. Please check your credentials.",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            await loginWithGoogle();
            toast({
                title: "Success",
                description: "You've been logged in with Google",
                status: "success",
                duration: 3000,
                isClosable: true,
            });
            onClose();
            navigate('/profile');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to log in with Google",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleView = () => {
        setIsLoginView(!isLoginView)
    }

    const isValidEmailDomain = (email: string) => {
        const validDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'mail.com'];
        const domain = email.split('@')[1];
        return validDomains.includes(domain);
    };

    const handleRegister = async () => {
        if (!registerEmail || !registerPassword) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (!isValidEmailDomain(registerEmail)) {
            toast({
                title: "Error",
                description: "Please use a valid email domain (gmail.com, yahoo.com, etc.)",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        if (registerPassword !== confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        try {
            setIsLoading(true);
            await signup(registerEmail, registerPassword);
            toast({
                title: "Success",
                description: "Account created successfully",
                status: "success",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
            onClose();
            navigate('/profile');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create account",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>
                    {isLoginView ? 'Login to Your Account' : 'Create an Account'}
                </ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    {isLoginView ? (
                        <Flex direction="column" gap={4}>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    placeholder="your.email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </FormControl>
                            <Button
                                colorScheme="blue"
                                width="full"
                                onClick={handleLogin}
                                isLoading={isLoading}
                            >
                                Login
                            </Button>

                            <HStack width="full">
                                <Divider />
                                <Text fontSize="sm" whiteSpace="nowrap">
                                    OR
                                </Text>
                                <Divider />
                            </HStack>

                            <HStack width="full">
                                <Button
                                    variant="outline"
                                    flex="1"
                                    onClick={handleGoogleLogin}
                                    isLoading={isLoading}
                                >
                                    <Box mr={2} display="inline-block">
                                        <FaGoogle />
                                    </Box>
                                    Google
                                </Button>
                                <Button variant="outline" flex="1" isDisabled={true}>
                                    <Box mr={2} display="inline-block">
                                        <FaGithub />
                                    </Box>
                                    GitHub
                                </Button>
                            </HStack>

                            <Text textAlign="center" mt={4}>
                                Don't have an account?{' '}
                                <Link color="blue.500" onClick={toggleView}>
                                    Sign up
                                </Link>
                            </Text>
                        </Flex>
                    ) : (
                        <Flex direction="column" gap={4}>
                            <FormControl>
                                <FormLabel>Name</FormLabel>
                                <Input placeholder="Your name" />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type="email"
                                    value={registerEmail}
                                    onChange={(e) => setRegisterEmail(e.target.value)}
                                    placeholder="your.email@example.com"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Password</FormLabel>
                                <Input
                                    type="password"
                                    value={registerPassword}
                                    onChange={(e) => setRegisterPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </FormControl>
                            <FormControl>
                                <FormLabel>Confirm Password</FormLabel>
                                <Input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="********"
                                />
                            </FormControl>
                            <Button
                                colorScheme="blue"
                                width="full"
                                mt={2}
                                onClick={handleRegister}
                                isLoading={isLoading}
                            >
                                Register
                            </Button>

                            <Text textAlign="center" mt={4}>
                                Already have an account?{' '}
                                <Link color="blue.500" onClick={toggleView}>
                                    Login
                                </Link>
                            </Text>
                        </Flex>
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

export default LoginModal 