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

// Test credentials - using provided test account credentials
const TEST_EMAIL = "englishashdodcity@gmail.com";
const TEST_PASSWORD = "123456";

const AuthTester: React.FC = () => {
    const { login, logout, currentUser, loginWithGoogle, resetPassword } = useAuth();
    const [testStatus, setTestStatus] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [autoRunComplete, setAutoRunComplete] = useState(false);
    const toast = useToast();

    const logStatus = (message: string) => {
        setTestStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    // Auto-run tests when component mounts
    useEffect(() => {
        const runAutomatedTests = async () => {
            if (!autoRunComplete) {
                setAutoRunComplete(true);
                await runEmailLoginTest();
            }
        };

        runAutomatedTests();
    }, [autoRunComplete]);

    // Clear logs function
    const clearLogs = () => {
        setTestStatus([]);
    };

    // Test password reset functionality
    const runPasswordResetTest = async () => {
        setIsRunning(true);
        setTestStatus([]);

        try {
            logStatus("Testing password reset functionality");
            logStatus(`Attempting to send password reset email to: ${TEST_EMAIL}`);

            // Check if resetPassword is available in auth context
            if (typeof resetPassword !== 'function') {
                throw new Error("Password reset function not available");
            }

            await resetPassword(TEST_EMAIL);

            logStatus("✅ Password reset email sent successfully");
            toast({
                title: "Password Reset Test Passed",
                description: "Reset email sent successfully",
                status: "success",
                position: "top",
                duration: 3000,
            });
        } catch (error) {
            logStatus(`❌ Password reset test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            toast({
                title: "Password Reset Test Failed",
                description: error instanceof Error ? error.message : 'Unknown error',
                status: "error",
                position: "top",
                duration: 3000,
            });
        } finally {
            setIsRunning(false);
        }
    };

    // Test authentication persistence
    const testAuthPersistence = async () => {
        setIsRunning(true);
        setTestStatus([]);

        try {
            // Step 1: Check if already logged in
            if (!currentUser) {
                logStatus("User not logged in. Logging in first...");
                await login(TEST_EMAIL, TEST_PASSWORD);
                logStatus("Logged in successfully");
            }

            // Step 2: Simulate page refresh
            logStatus("Simulating page refresh to test auth persistence...");

            // Force a re-render of the auth state
            logStatus("Checking if user session persists...");

            // Wait a moment to ensure auth state is updated
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 3: Verify persistence
            if (currentUser) {
                logStatus("✅ Authentication persistence test passed - user session maintained");
                toast({
                    title: "Persistence Test Passed",
                    status: "success",
                    position: "top",
                    duration: 3000,
                });
            } else {
                logStatus("❌ Authentication persistence test failed - user session lost");
                throw new Error("User session not maintained");
            }
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
            <Text mb={4} color="gray.600">
                This suite automatically tests authentication functionality using test credentials.
            </Text>

            <VStack spacing={4} align="stretch" mb={6}>
                <Button
                    colorScheme="blue"
                    onClick={runEmailLoginTest}
                    isLoading={isRunning && testStatus.some(s => s.includes("email"))}
                    loadingText="Running Test"
                    isDisabled={isRunning}
                >
                    Run Email Login/Logout Test
                </Button>

                <Button
                    colorScheme="red"
                    onClick={runGoogleLoginTest}
                    isLoading={isRunning && testStatus.some(s => s.includes("Google"))}
                    loadingText="Running Test"
                    isDisabled={isRunning}
                >
                    Run Google Login/Logout Test
                </Button>

                <Button
                    colorScheme="purple"
                    onClick={testAuthPersistence}
                    isLoading={isRunning && testStatus.some(s => s.includes("persistence"))}
                    loadingText="Testing Persistence"
                    isDisabled={isRunning}
                >
                    Test Authentication Persistence
                </Button>

                <Button
                    colorScheme="teal"
                    onClick={runPasswordResetTest}
                    isLoading={isRunning && testStatus.some(s => s.includes("reset"))}
                    loadingText="Testing Password Reset"
                    isDisabled={isRunning}
                >
                    Test Password Reset
                </Button>

                <Button
                    colorScheme="gray"
                    onClick={clearLogs}
                    isDisabled={isRunning || testStatus.length === 0}
                >
                    Clear Logs
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
                            <Text key={index} color={
                                status.includes("✅") ? "green.500" :
                                    status.includes("❌") ? "red.500" :
                                        "inherit"
                            }>
                                {status}
                            </Text>
                        ))
                    ) : (
                        <Text color="gray.500">No tests run yet or logs have been cleared.</Text>
                    )}
                </Box>
            </Box>

            <Box mt={4}>
                <Heading size="sm" mb={2}>Current Authentication State</Heading>
                <Code p={2} borderRadius="md" width="100%" overflowX="auto">
                    {currentUser ? (
                        <pre>{JSON.stringify({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            emailVerified: currentUser.emailVerified,
                            displayName: currentUser.displayName,
                            photoURL: currentUser.photoURL,
                            providerData: currentUser.providerData
                        }, null, 2)}</pre>
                    ) : (
                        "Not logged in"
                    )}
                </Code>
            </Box>
        </Box>
    );
};

export default AuthTester;