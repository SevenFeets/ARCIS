import { Box, Heading, Text } from '@chakra-ui/react'

function Home() {
    return (
        <Box p={5}>
            <Heading as="h1" size="xl" mb={4}>Home Page</Heading>
            <Text fontSize="lg">Welcome to our website!</Text>
        </Box>
    )
}

export default Home