import {
    Box,
    Container,
    Heading,
    Text,
    VStack,
    Card,
    CardBody,
    CardHeader,
    SimpleGrid,
    Link,
    Badge,
    HStack,
    Icon,
    Divider,
    Tag,
    TagLabel,
    useColorModeValue
} from '@chakra-ui/react'
import { FiExternalLink, FiFileText, FiCalendar, FiUsers } from 'react-icons/fi'

// Define the article data structure
interface Article {
    id: number;
    title: string;
    authors: string[];
    journal?: string;
    conference?: string;
    year: number;
    url: string;
    abstract: string;
    topics: string[];
    type: 'journal' | 'conference' | 'preprint' | 'book_chapter';
}

const ArticlesPage = () => {
    const cardBg = useColorModeValue('white', 'gray.800');
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    // Research articles data based on the URLs provided and search results
    const articles: Article[] = [
        {
            id: 1,
            title: "A survey of air combat behavior modeling using machine learning",
            authors: ["Patrick Ribu Gorton", "Andreas Strand", "Karsten Brathen"],
            journal: "IEEE Journal",
            year: 2024,
            url: "https://arxiv.org/pdf/2404.13954",
            abstract: "This survey explores the application of machine learning techniques for modeling air combat behavior, motivated by the potential to enhance simulation-based pilot training. Current simulated entities tend to lack realistic behavior, and traditional behavior modeling is labor-intensive and prone to loss of essential domain knowledge between development steps.",
            topics: ["Machine Learning", "Air Combat", "Behavioral Modeling", "Military Simulation", "Reinforcement Learning"],
            type: "preprint"
        },
        {
            id: 2,
            title: "Development and Optimization of Deep Learning Models for Weapon Detection in Surveillance Videos",
            authors: ["Various Authors"],
            conference: "International Conference on Communication and Information Processing",
            year: 2023,
            url: "https://onlinelibrary.wiley.com/doi/pdf/10.1155/2023/7678382",
            abstract: "This paper presents advanced deep learning approaches for automated weapon detection in surveillance systems, focusing on real-time processing and high accuracy detection rates in various environmental conditions.",
            topics: ["Deep Learning", "Weapon Detection", "Computer Vision", "Surveillance", "Security Systems"],
            type: "journal"
        },
        {
            id: 3,
            title: "Machine Learning Techniques for Autonomous Agents in Military Simulations",
            authors: ["Ming Hou", "Various Contributors"],
            conference: "Military Simulation Conference",
            year: 2023,
            url: "https://www.researchgate.net/profile/Ming-Hou-2/publication/320923520_Machine_Learning_Techniques_for_Autonomous_Agents_in_Military_Simulations-Multum_in_Parvo/links/5a56222545851547b1beeca8/Machine-Learning-Techniques-for-Autonomous-Agents-in-Military-Simulations-Multum-in-Parvo.pdf",
            abstract: "Comprehensive review of machine learning applications in military simulation environments, covering autonomous agent behavior, decision-making processes, and tactical scenario modeling.",
            topics: ["Military AI", "Autonomous Agents", "Simulation", "Decision Making", "Tactical Systems"],
            type: "conference"
        },
        {
            id: 4,
            title: "A Military Human Performance Management System Design using Machine Learning Algorithms",
            authors: ["James Jin Kang", "Research Team"],
            journal: "IEEE Systems Journal",
            year: 2023,
            url: "https://www.researchgate.net/profile/James_Jin_Kang/publication/357363295_A_Military_Human_Performance_Management_System_Design_using_Machine_Learning_Algorithms/links/620327c0c8b46c1ad97573e6/A-Military-Human-Performance-Management-System-Design-using-Machine-Learning-Algorithms.pdf",
            abstract: "Design and implementation of machine learning-based systems for monitoring and optimizing human performance in military contexts, including stress detection, fatigue analysis, and performance prediction.",
            topics: ["Human Performance", "Military Systems", "Health Monitoring", "Performance Analytics", "Biometrics"],
            type: "journal"
        },
        {
            id: 5,
            title: "Application of Deep Learning for Weapons Detection in Surveillance Videos",
            authors: ["Security Research Team"],
            journal: "Computer Vision and Security",
            year: 2023,
            url: "/articles/Application_of_deep_learning_for_weapons_detectionin_surveillance_videos.pdf",
            abstract: "Advanced techniques for real-time weapon detection using deep neural networks, focusing on YOLO architectures and computer vision methods for security applications.",
            topics: ["Deep Learning", "YOLO", "Object Detection", "Security", "Real-time Processing"],
            type: "journal"
        },
        {
            id: 6,
            title: "Machine Learning in Computer Vision: A Review",
            authors: ["Computer Vision Research Group"],
            journal: "International Journal of Computer Vision",
            year: 2023,
            url: "/articles/Machine Learning in Computer Vision A Review.pdf",
            abstract: "Comprehensive review of machine learning applications in computer vision, covering object detection, image classification, and deep learning architectures relevant to security systems.",
            topics: ["Computer Vision", "Machine Learning", "Object Detection", "Image Processing", "Deep Learning"],
            type: "journal"
        },
        {
            id: 7,
            title: "Military Applications of Machine Learning: A Bibliometric Perspective",
            authors: ["Defense Research Institute"],
            journal: "Military Technology Review",
            year: 2023,
            url: "/articles/Military Applications of Machine Learning A Bibliometric Perspective.pdf",
            abstract: "Bibliometric analysis of machine learning applications in military and defense contexts, examining research trends, collaboration patterns, and emerging technologies.",
            topics: ["Military Technology", "Machine Learning", "Bibliometric Analysis", "Defense Research", "Technology Trends"],
            type: "journal"
        }
    ];

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'journal': return 'blue';
            case 'conference': return 'green';
            case 'preprint': return 'orange';
            case 'book_chapter': return 'purple';
            default: return 'gray';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'journal': return 'Journal';
            case 'conference': return 'Conference';
            case 'preprint': return 'Preprint';
            case 'book_chapter': return 'Book Chapter';
            default: return 'Article';
        }
    };

    return (
        <Box py={10}>
            <Container maxW="container.xl">
                <VStack spacing={8} align="stretch">
                    {/* Header Section */}
                    <Box textAlign="center">
                        <Heading as="h1" size="2xl" mb={4}>
                            Research Articles
                        </Heading>
                        <Text fontSize="lg" color="gray.600" maxW="container.md" mx="auto">
                            Explore cutting-edge research in machine learning, computer vision, and military applications
                            that drive the development of advanced security and detection systems like ARCIS.
                        </Text>
                    </Box>

                    <Divider />

                    {/* Articles Grid */}
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={6}>
                        {articles.map((article) => (
                            <Card
                                key={article.id}
                                bg={cardBg}
                                borderColor={borderColor}
                                borderWidth="1px"
                                shadow="md"
                                _hover={{ shadow: "lg", transform: "translateY(-2px)" }}
                                transition="all 0.2s"
                            >
                                <CardHeader pb={3}>
                                    <VStack spacing={3} align="stretch">
                                        <HStack justify="space-between" align="start">
                                            <Badge
                                                colorScheme={getTypeColor(article.type)}
                                                variant="solid"
                                                fontSize="xs"
                                            >
                                                {getTypeLabel(article.type)}
                                            </Badge>
                                            <Link
                                                href={article.url}
                                                isExternal
                                                color="blue.500"
                                                _hover={{ color: "blue.600" }}
                                            >
                                                <Icon as={FiExternalLink} />
                                            </Link>
                                        </HStack>

                                        <Heading size="md" lineHeight="1.3">
                                            <Link
                                                href={article.url}
                                                isExternal
                                                _hover={{ textDecoration: "none", color: "blue.500" }}
                                            >
                                                {article.title}
                                            </Link>
                                        </Heading>
                                    </VStack>
                                </CardHeader>

                                <CardBody pt={0}>
                                    <VStack spacing={4} align="stretch">
                                        {/* Authors */}
                                        <HStack spacing={2} align="center">
                                            <Icon as={FiUsers} color="gray.500" />
                                            <Text fontSize="sm" color="gray.600">
                                                {article.authors.slice(0, 3).join(', ')}
                                                {article.authors.length > 3 && ' et al.'}
                                            </Text>
                                        </HStack>

                                        {/* Publication Info */}
                                        <HStack spacing={4}>
                                            <HStack spacing={1}>
                                                <Icon as={FiFileText} color="gray.500" />
                                                <Text fontSize="sm" color="gray.600">
                                                    {article.journal || article.conference}
                                                </Text>
                                            </HStack>
                                            <HStack spacing={1}>
                                                <Icon as={FiCalendar} color="gray.500" />
                                                <Text fontSize="sm" color="gray.600">
                                                    {article.year}
                                                </Text>
                                            </HStack>
                                        </HStack>

                                        {/* Abstract */}
                                        <Text fontSize="sm" color="gray.700" lineHeight="1.5">
                                            {article.abstract}
                                        </Text>

                                        {/* Topics */}
                                        <Box>
                                            <Text fontSize="xs" fontWeight="medium" color="gray.500" mb={2}>
                                                Topics:
                                            </Text>
                                            <HStack spacing={1} flexWrap="wrap">
                                                {article.topics.map((topic, index) => (
                                                    <Tag
                                                        key={index}
                                                        size="sm"
                                                        colorScheme="blue"
                                                        variant="subtle"
                                                        mb={1}
                                                    >
                                                        <TagLabel>{topic}</TagLabel>
                                                    </Tag>
                                                ))}
                                            </HStack>
                                        </Box>

                                        {/* Read Button */}
                                        <Link href={article.url} isExternal>
                                            <Box
                                                as="button"
                                                bg="blue.500"
                                                color="white"
                                                px={4}
                                                py={2}
                                                borderRadius="md"
                                                fontSize="sm"
                                                fontWeight="medium"
                                                _hover={{ bg: "blue.600" }}
                                                transition="background 0.2s"
                                                w="full"
                                            >
                                                Read Full Paper
                                                <Icon as={FiExternalLink} ml={2} />
                                            </Box>
                                        </Link>
                                    </VStack>
                                </CardBody>
                            </Card>
                        ))}
                    </SimpleGrid>

                    {/* Footer Note */}
                    <Box textAlign="center" pt={8}>
                        <Text fontSize="sm" color="gray.500">
                            These research articles inform the development of ARCIS and showcase the latest advances
                            in machine learning applications for security and defense systems.
                        </Text>
                    </Box>
                </VStack>
            </Container>
        </Box>
    );
};

export default ArticlesPage;
