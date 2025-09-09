import {
    Box,
    Container,
    Heading,
    Text,
    Stack,
    Button,
    SimpleGrid,
    Icon,
    HStack
} from '@chakra-ui/react'
import { FormControl, FormLabel } from '@chakra-ui/form-control'
import { Input } from '@chakra-ui/input'
import { Textarea } from '@chakra-ui/textarea'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'

const ContactPage = () => {
    return (
        <Box py={10}>
            <Container maxW="container.lg">
                <Stack direction="column" gap="8" align="stretch">
                    <Heading as="h1" size="2xl" textAlign="center">
                        Contact Us
                    </Heading>

                    <Text fontSize="lg" textAlign="center">
                        Have questions or feedback? We'd love to hear from you!
                    </Text>

                    <SimpleGrid columns={{ base: 1, md: 2 }} gap="10" mt={10}>
                        {/* Contact Form */}
                        <Box>
                            <Stack as="form" direction="column" gap="4" align="stretch">
                                <FormControl isRequired>
                                    <FormLabel>Name</FormLabel>
                                    <Input placeholder="Your name" />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Email</FormLabel>
                                    <Input type="email" placeholder="your.email@example.com" />
                                </FormControl>

                                <FormControl isRequired>
                                    <FormLabel>Message</FormLabel>
                                    <Textarea placeholder="Your message" rows={6} />
                                </FormControl>

                                <Button colorScheme="blue" type="submit" alignSelf="flex-start">
                                    Send Message
                                </Button>
                            </Stack>
                        </Box>

                        {/* Contact Information */}
                        <Box>
                            <Stack direction="column" gap="8" align="stretch">
                                <Heading as="h3" size="md">
                                    Contact Information
                                </Heading>

                                <Stack direction="column" gap="4" align="stretch">
                                    <HStack>
                                        <Icon as={FiMail} boxSize={5} />
                                        <Text>be22century@ARCIS-LTD.int</Text>
                                    </HStack>

                                    <HStack>
                                        <Icon as={FiPhone} boxSize={5} />
                                        <Text>+972 (03) 555-0123</Text>
                                    </HStack>

                                    <HStack>
                                        <Icon as={FiMapPin} boxSize={5} />
                                        <Text>Ayalon 7 Boulevard, Tel Aviv, Israel</Text>
                                    </HStack>
                                </Stack>
                            </Stack>
                        </Box>
                    </SimpleGrid>
                </Stack>
            </Container>
        </Box>
    )
}

export default ContactPage 