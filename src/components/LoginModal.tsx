import {
    Box,
    Button,
    VStack,
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
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useToast
} from '@chakra-ui/react'
import { FaGithub, FaGoogle } from 'react-icons/fa'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, loginWithGoogle } = useAuth();
    const toast = useToast();

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

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Login to Your Account</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack gap={4}>
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
                    </VStack>
                </ModalBody>

                <ModalFooter justifyContent="center">
                    <Text fontSize="sm">
                        Don't have an account?{' '}
                        <Link color="blue.500" onClick={onClose}>
                            Sign up
                        </Link>
                    </Text>
                </ModalFooter>
            </ModalContent>
        </Modal>
    )
}

export default LoginModal 