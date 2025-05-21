import React, { useEffect, useState } from 'react';
import {
    Box,
    Button,
    VStack,
    Text,
    Heading,
    Code,
    Divider,
    useToast
} from '@chakra-ui/react';
import { useAuth } from '../../context/AuthContext';

// Test credentials - replace with valid test account credentials
const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password123";

const AuthTester: React.FC = () => {
    const { login, logout, currentUser, loginWithGoogle } = useAuth();
    const [testStatus, setTestStatus] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const toast = useToast();

    const logStatus = (message: string) => {
        setTestStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const runEmailLoginTest = async () => {
        setIsRunning(true);
        setTestStatus([]);

        try {
            // Step 1: Check if already logged in
            if (currentUser) {
                logStatus("User already logged in. Logging out first...");
                await logout();
                logStatus("Logged out successfully");
            }

            // Step 2: Attempt login
            logStatus(`Attempting login with email: ${TEST_EMAIL}`);
            await login(TEST_EMAIL, TEST_PASSWORD);

            // Step 3: Verify login success
            if (currentUser) {
                logStatus("✅ Login successful");
                toast({
                    title: "Login Test Passed",
                    status: "success",
                    position: "top",
                    duration: 3000,
                });
            } else {
                logStatus("❌ Login failed - user not detected after login");
                throw new Error("User not detected after login");
            }

            // Step 4: Wait a moment then logout
            logStatus("Waiting 2 seconds before logout...");
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 5: Attempt logout
            logStatus("Attempting logout");
            await logout();

            // Step 6: Verify logout success
            if (!currentUser) {
                logStatus("✅ Logout successful");
                toast({
                    title: "Logout Test Passed",
                    status: "success",
                    position: "top",
                    duration: 3000,
                });
            } else {
                logStatus("❌ Logout failed - user still detected after logout");
                throw new Error("User still detected after logout");
            }

            logStatus("✅ Full test completed successfully");
        } catch (error) {
            logStatus(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast({
                title: "Test Failed",
                description: error instanceof Error ? error.message : 'Unknown error',
                status: "error",
                position: "top",
                duration: 3000,
            });
        } finally {
            setIsRunning(false);
        }
    };

    const runGoogleLoginTest = async () => {
        setIsRunning(true);
        setTestStatus([]);

        try {
            // Step 1: Check if already logged in
            if (currentUser) {
                logStatus("User already logged in. Logging out first...");
                await logout();
                logStatus("Logged out successfully");
            }

            // Step 2: Attempt Google login
            logStatus("Attempting login with Google");
            await loginWithGoogle();

            // Step 3: Verify login success
            if (currentUser) {
                logStatus("✅ Google login successful");
                toast({
                    title: "Google Login Test Passed",
                    status: "success",
                    position: "top",
                    duration: 3000,
                });
            } else {
                logStatus("❌ Google login failed - user not detected after login");
                throw new Error("User not detected after Google login");
            }

            // Step 4: Wait a moment then logout
            logStatus("Waiting 2 seconds before logout...");
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 5: Attempt logout
            logStatus("Attempting logout");
            await logout();

            // Step 6: Verify logout success
            if (!currentUser) {
                logStatus("✅ Logout successful");
                toast({
                    title: "Logout Test Passed",
                    status: "success",
                    position: "top",
                    duration: 3000,
                });
            } else {
                logStatus("❌ Logout failed - user still detected after logout");
                throw new Error("User still detected after logout");
            }

            logStatus("✅ Full Google auth test completed successfully");
        } catch (error) {
            logStatus(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast({
                title: "Test Failed",
                description: error instanceof Error ? error.message : 'Unknown error',
                status: "error",
                position: "top",
                duration: 3000,
            });
        } finally {
            setIsRunning(false);
        }
    };

    // Display current auth state
    useEffect(() => {
        if (currentUser) {
            logStatus(`Current user: ${currentUser.email}`);
        }
    }, [currentUser]);

    return (
        <Box p={6} borderWidth="1px" borderRadius="lg" shadow="md" maxW="800px" mx="auto" my={8}>
            <Heading size="lg" mb={4}>Authentication Test Suite</Heading>

            <VStack spacing={4} align="stretch" mb={6}>
                <Button
                    colorScheme="blue"
                    onClick={runEmailLoginTest}
                    isLoading={isRunning}
                    loadingText="Running Test"
                    isDisabled={isRunning}
                >
                    Run Email Login/Logout Test
                </Button>

                <Button
                    colorScheme="red"
                    onClick={runGoogleLoginTest}
                    isLoading={isRunning}
                    loadingText="Running Test"
                    isDisabled={isRunning}
                >
                    Run Google Login/Logout Test
                </Button>
            </VStack>

            <Divider my={4} />

            <Box>
                <Heading size="md" mb={2}>Test Status Log</Heading>
                <Box
                    bg="gray.50"
                    _dark={{ bg: "gray.700" }}
                    p={3}
                    borderRadius="md"
                    height="300px"
                    overflowY="auto"
                    fontFamily="monospace"
                >
                    {testStatus.length > 0 ? (
                        testStatus.map((status, index) => (
                            <Text key={index}>{status}</Text>
                        ))
                    ) : (
                        <Text color="gray.500">No tests run yet. Click a button above to start testing.</Text>
                    )}
                </Box>
            </Box>

            <Box mt={4}>
                <Heading size="sm" mb={2}>Current Authentication State</Heading>
                <Code p={2} borderRadius="md" width="100%">
                    {currentUser ? (
                        <pre>{JSON.stringify(currentUser, null, 2)}</pre>
                    ) : (
                        "Not logged in"
                    )}
                </Code>
            </Box>
        </Box>
    );
};

export default AuthTester;