import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Button,
    FormControl,
    FormLabel,
    Input,
    useToast,
    Divider,
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay
} from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'
import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const ProfilePage = () => {
    const { currentUser, updateUserEmail, updateUserPassword, deleteAccount } = useAuth()
    const [email, setEmail] = useState(currentUser?.email || '')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const cancelRef = useRef<HTMLButtonElement>(null)
    const toast = useToast()
    const navigate = useNavigate()

    const handleEmailUpdate = async () => {
        if (!email || email === currentUser?.email) return

        try {
            setIsUpdating(true)
            await updateUserEmail(email)
            toast({
                title: "Success",
                description: "Email updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update email",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handlePasswordUpdate = async () => {
        if (!password || password !== confirmPassword) {
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
            setIsUpdating(true)
            await updateUserPassword(password)
            setPassword('')
            setConfirmPassword('')
            toast({
                title: "Success",
                description: "Password updated successfully",
                status: "success",
                duration: 3000,
                isClosable: true,
            })
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update password",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
        } finally {
            setIsUpdating(false)
        }
    }

    const handleDeleteAccount = async () => {
        try {
            await deleteAccount()
            toast({
                title: "Account Deleted",
                description: "Your account has been permanently deleted",
                status: "info",
                duration: 5000,
                isClosable: true,
            })
            navigate('/')
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete account",
                status: "error",
                duration: 3000,
                isClosable: true,
            })
        }
    }

    return (
        <Box py={10}>
            <Container maxW="container.md">
                <VStack spacing={8} align="stretch">
                    <Heading as="h1" size="xl">Your Profile</Heading>
                    <Text fontSize="lg">Email: {currentUser?.email}</Text>

                    <Divider my={6} />

                    <Heading as="h2" size="md">Update Email</Heading>
                    <FormControl>
                        <FormLabel>New Email</FormLabel>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </FormControl>
                    <Button
                        colorScheme="blue"
                        onClick={handleEmailUpdate}
                        isLoading={isUpdating}
                        alignSelf="flex-start"
                    >
                        Update Email
                    </Button>

                    <Divider my={6} />

                    <Heading as="h2" size="md">Update Password</Heading>
                    <FormControl>
                        <FormLabel>New Password</FormLabel>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </FormControl>
                    <FormControl mt={4}>
                        <FormLabel>Confirm New Password</FormLabel>
                        <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </FormControl>
                    <Button
                        colorScheme="blue"
                        onClick={handlePasswordUpdate}
                        isLoading={isUpdating}
                        alignSelf="flex-start"
                    >
                        Update Password
                    </Button>

                    <Divider my={6} />

                    <Box>
                        <Heading as="h2" size="md" color="red.500" mb={4}>Danger Zone</Heading>
                        <Button
                            colorScheme="red"
                            onClick={() => setIsDeleteDialogOpen(true)}
                        >
                            Delete Account
                        </Button>
                    </Box>
                </VStack>
            </Container>

            <AlertDialog
                isOpen={isDeleteDialogOpen}
                leastDestructiveRef={cancelRef}
                onClose={() => setIsDeleteDialogOpen(false)}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Delete Account
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure? This action cannot be undone. All your data will be permanently deleted.
                        </AlertDialogBody>

                        <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button colorScheme="red" onClick={handleDeleteAccount} ml={3}>
                                Delete
                            </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    )
}

export default ProfilePage 