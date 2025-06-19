import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Text,
    VStack,
    Link,
    useToast
} from '@chakra-ui/react'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { signup } = useAuth()
    const toast = useToast()
    const navigate = useNavigate()

    const handleRegister = async () => {
        if (!email || !password) {
            toast({
                title: "Error",
                description: "Please fill in all fields",
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
                title: "Account created",
                description: "You've been successfully registered",
                status: "success",
                duration: 3000,
                isClosable: true,
            })
            navigate('/')
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create an account",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Box py={10}>
            <Container maxW="md">
                <VStack spacing={8}>
                    <Heading>Create an Account</Heading>
                    <VStack as="form" spacing={4} w="100%">
                        <FormControl isRequired>
                            <FormLabel>Email</FormLabel>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Password</FormLabel>
                            <Input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </FormControl>
                        <FormControl isRequired>
                            <FormLabel>Confirm Password</FormLabel>
                            <Input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </FormControl>
                        <Button
                            colorScheme="blue"
                            width="full"
                            mt={4}
                            onClick={handleRegister}
                            isLoading={isLoading}
                        >
                            Register
                        </Button>
                    </VStack>
                    <Text>
                        Already have an account?{' '}
                        <Link as={RouterLink} to="/login" color="blue.500">
                            Login
                        </Link>
                    </Text>
                </VStack>
            </Container>
        </Box>
    )
}

export default RegisterPage 