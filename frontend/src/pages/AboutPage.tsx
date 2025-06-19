import { Box, Container, Heading, Text, VStack, Image, SimpleGrid } from '@chakra-ui/react'

const AboutPage = () => {
    return (
        <Box py={10}>
            <Container maxW="container.lg">
                <VStack gap={8} alignItems="stretch">
                    <Heading as="h1" size="2xl" textAlign="center">
                        About Us
                    </Heading>

                    <Text fontSize="lg">
                        This is where you can describe your project, its purpose, and your motivation for creating it.
                        Include information about the problem you're solving and why it matters.
                    </Text>

                    {/* Team Section */}
                    <Box mt={10}>
                        <Heading as="h2" size="xl" mb={8} textAlign="center">
                            Our Team
                        </Heading>
                        <SimpleGrid columns={{ base: 1, md: 3 }} gap={10}>
                            {[
                                { name: 'Your Name', role: 'Developer', image: 'https://via.placeholder.com/150' },
                                // Add more team members as needed
                            ].map((member, index) => (
                                <VStack key={index} align="center">
                                    <Image
                                        src={member.image}
                                        alt={member.name}
                                        borderRadius="full"
                                        boxSize="150px"
                                        objectFit="cover"
                                    />
                                    <Heading as="h3" size="md">{member.name}</Heading>
                                    <Text>{member.role}</Text>
                                </VStack>
                            ))}
                        </SimpleGrid>
                    </Box>
                </VStack>
            </Container>
        </Box>
    )
}

export default AboutPage 