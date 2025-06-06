import React, { useState } from 'react';
import { Box, Button, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';

const SimpleApiTest: React.FC = () => {
    const [result, setResult] = useState<string>('Not tested yet');
    const [loading, setLoading] = useState<boolean>(false);

    const testConnection = async () => {
        setLoading(true);
        setResult('Testing...');

        try {
            console.log('Making request to: http://localhost:5000/api/health');
            const response = await axios.get('http://localhost:5000/api/health');
            console.log('Response:', response.data);
            setResult(`✅ Success: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error('Error:', error);
            setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box p={6} maxW="600px" mx="auto">
            <VStack spacing={4} align="stretch">
                <Text fontSize="xl" fontWeight="bold">
                    Simple API Connection Test
                </Text>

                <Button
                    onClick={testConnection}
                    colorScheme="blue"
                    isLoading={loading}
                >
                    Test Backend Connection
                </Button>

                <Box p={4} border="1px solid #ccc" borderRadius="md">
                    <Text fontSize="sm" whiteSpace="pre-wrap">
                        {result}
                    </Text>
                </Box>
            </VStack>
        </Box>
    );
};

export default SimpleApiTest; 