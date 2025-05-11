import { Box, Container, Text, Flex, Link, HStack, Icon } from '@chakra-ui/react'
import { FiGithub, FiLinkedin, FiMail } from 'react-icons/fi'

const Footer = () => {
    return (
        <Box as="footer" py={6} mt="auto">
            <Container maxW="container.lg">
                <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align="center">
                    <Text>&copy; {new Date().getFullYear()} Your Project Name. All rights reserved.</Text>

                    <HStack gap={4} marginTop={{ base: 4, md: 0 }}>
                        <Link href="https://github.com/yourusername" target="_blank" rel="noopener noreferrer">
                            <Icon as={FiGithub} boxSize={5} />
                        </Link>
                        <Link href="https://linkedin.com/in/yourusername" target="_blank" rel="noopener noreferrer">
                            <Icon as={FiLinkedin} boxSize={5} />
                        </Link>
                        <Link href="mailto:your.email@example.com">
                            <Icon as={FiMail} boxSize={5} />
                        </Link>
                    </HStack>
                </Flex>
            </Container>
        </Box>
    )
}

export default Footer 