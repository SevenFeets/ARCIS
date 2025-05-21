import {
    Box,
    Flex,
    Button,
    Heading,
    Stack,
    IconButton,
    useDisclosure,
    useColorMode,
    Image,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Avatar,
    useToast
} from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { FiMoon, FiSun, FiUser, FiLogOut } from 'react-icons/fi'
import { useRef } from 'react'
import LoginModal from './LoginModal'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
    const { colorMode, toggleColorMode } = useColorMode()
    const {
        isOpen: isLoginOpen,
        onOpen: onLoginOpen,
        onClose: onLoginClose
    } = useDisclosure()
    const btnRef = useRef<HTMLButtonElement>(null)
    const { currentUser, logout } = useAuth()
    const toast = useToast()

    const handleLogout = async () => {
        try {
            await logout();
            toast({
                title: "Success",
                description: "Successfully logged out",
                status: "success",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        } catch (error) {
            console.error("Failed to log out", error);
            toast({
                title: "Error",
                description: "Failed to log out",
                status: "error",
                position: "top",
                duration: 3000,
                isClosable: true,
            });
        }
    }

    return (
        <Box as="nav" py={4} px={6} shadow="md" bg={colorMode === 'dark' ? 'gray.800' : 'white'}>
            <Flex justify="space-between" align="center">
                {/* Logo in navbar */}
                <Flex align="center">
                    <Image
                        src="/src/images/ARCIS_logo.jpg"
                        alt="ARCIS Logo"
                        height="80px"
                        mr={3}
                    />
                    <Heading size="md" display={{ base: 'none', md: 'block' }}>
                        <RouterLink to="/">ARCIS</RouterLink>
                    </Heading>
                </Flex>

                {/* Desktop Navigation */}
                <Stack direction="row" gap="6" display={{ base: 'none', md: 'flex' }}>
                    <RouterLink to="/">
                        <Button
                            variant="solid"
                            fontWeight="medium"
                            px={4}
                            borderRadius="md"
                            bg="blue.400"
                            color="white"
                            transition="all 0.2s"
                            _hover={{
                                bg: 'orange.400',
                                transform: 'translateY(-2px)',
                                boxShadow: 'md'
                            }}
                            _active={{ transform: 'translateY(0)' }}
                        >
                            Home
                        </Button>
                    </RouterLink>
                    <RouterLink to="/about">
                        <Button
                            variant="solid"
                            fontWeight="medium"
                            px={4}
                            borderRadius="md"
                            bg="blue.400"
                            color="white"
                            transition="all 0.2s"
                            _hover={{
                                bg: 'orange.400',
                                transform: 'translateY(-2px)',
                                boxShadow: 'md'
                            }}
                            _active={{ transform: 'translateY(0)' }}
                        >
                            About
                        </Button>
                    </RouterLink>
                    <RouterLink to="/contact">
                        <Button
                            variant="solid"
                            fontWeight="medium"
                            px={4}
                            borderRadius="md"
                            bg="blue.400"
                            color="white"
                            transition="all 0.2s"
                            _hover={{
                                bg: 'orange.400',
                                transform: 'translateY(-2px)',
                                boxShadow: 'md'
                            }}
                            _active={{ transform: 'translateY(0)' }}
                        >
                            Contact
                        </Button>
                    </RouterLink>
                    <RouterLink to="/articles">
                        <Button
                            variant="solid"
                            fontWeight="medium"
                            px={4}
                            borderRadius="md"
                            bg="blue.400"
                            color="white"
                            transition="all 0.2s"
                            _hover={{
                                bg: 'orange.400',
                                transform: 'translateY(-2px)',
                                boxShadow: 'md'
                            }}
                            _active={{ transform: 'translateY(0)' }}
                        >
                            Articles
                        </Button>
                    </RouterLink>
                </Stack>

                {/* Right side buttons */}
                <Stack direction="row" spacing={2} align="center">
                    <IconButton
                        aria-label="Toggle color mode"
                        icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
                        onClick={toggleColorMode}
                        variant="ghost"
                    />

                    {currentUser ? (
                        <Menu>
                            <MenuButton>
                                <Avatar
                                    size="sm"
                                    name={currentUser.displayName || undefined}
                                    src={currentUser.photoURL || undefined}
                                />
                            </MenuButton>
                            <MenuList>
                                <MenuItem as={RouterLink} to="/profile">Profile</MenuItem>
                                <MenuItem onClick={handleLogout} icon={<FiLogOut />}>Logout</MenuItem>
                                {currentUser && (
                                    <MenuItem as={RouterLink} to="/auth-test">Auth Tester</MenuItem>
                                )}
                            </MenuList>
                        </Menu>
                    ) : (
                        <Button
                            ref={btnRef}
                            onClick={onLoginOpen}
                            leftIcon={<FiUser />}
                        >
                            Login
                        </Button>
                    )}
                </Stack>
            </Flex>

            <LoginModal isOpen={isLoginOpen} onClose={onLoginClose} />
        </Box>
    )
}

export default Navbar 