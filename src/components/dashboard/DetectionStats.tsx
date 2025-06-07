import React, { useMemo } from 'react';
import {
    Card,
    CardHeader,
    CardBody,
    Heading,
    Grid,
    Stat,
    StatLabel,
    StatNumber,
    StatHelpText,
    Text,
    VStack,
    HStack,
    Badge,
    Progress,
    Box
} from '@chakra-ui/react';
import { Detection } from '../../api/detections';

interface DetectionStatsProps {
    detections: Detection[];
}

const DetectionStats: React.FC<DetectionStatsProps> = ({ detections }) => {
    const stats = useMemo(() => {
        const total = detections.length;

        // Group by weapon type
        const weaponCounts = detections.reduce((acc, detection) => {
            acc[detection.weapon_type] = (acc[detection.weapon_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Group by threat level
        const threatLevels = detections.reduce((acc, detection) => {
            const level = detection.threat_level;
            if (level >= 9) acc.critical++;
            else if (level >= 7) acc.high++;
            else if (level >= 5) acc.medium++;
            else acc.low++;
            return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });

        // Group by device type
        const deviceCounts = detections.reduce((acc, detection) => {
            acc[detection.device] = (acc[detection.device] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate average confidence
        const avgConfidence = total > 0
            ? Math.round(detections.reduce((sum, d) => sum + d.confidence, 0) / total)
            : 0;

        // Recent activity (last 24 hours)
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentDetections = detections.filter(d => new Date(d.timestamp) > last24h);

        // Location analysis
        const locationCounts = detections.reduce((acc, detection) => {
            const location = detection.location || 'Unknown';
            acc[location] = (acc[location] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total,
            weaponCounts,
            threatLevels,
            deviceCounts,
            avgConfidence,
            recentCount: recentDetections.length,
            locationCounts
        };
    }, [detections]);

    const getWeaponTypeIcon = (weaponType: string) => {
        if (!weaponType) return '⚠️';
        switch (weaponType.toLowerCase()) {
            case 'rifle': return '🔫';
            case 'pistol': return '🔫';
            case 'knife': return '🗡️';
            default: return '⚠️';
        }
    };

    const getThreatLevelColor = (level: string) => {
        switch (level) {
            case 'critical': return 'red';
            case 'high': return 'orange';
            case 'medium': return 'yellow';
            case 'low': return 'green';
            default: return 'gray';
        }
    };

    return (
        <VStack spacing={6} align="stretch">
            {/* Overview Stats */}
            <Grid templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }} gap={4}>
                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Total Detections</StatLabel>
                            <StatNumber color="blue.500">{stats.total}</StatNumber>
                            <StatHelpText>All time</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Last 24 Hours</StatLabel>
                            <StatNumber color="green.500">{stats.recentCount}</StatNumber>
                            <StatHelpText>Recent activity</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Avg Confidence</StatLabel>
                            <StatNumber color="purple.500">{stats.avgConfidence}%</StatNumber>
                            <StatHelpText>Detection accuracy</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>

                <Card>
                    <CardBody>
                        <Stat>
                            <StatLabel>Critical Threats</StatLabel>
                            <StatNumber color="red.500">{stats.threatLevels.critical}</StatNumber>
                            <StatHelpText>Level 9-10</StatHelpText>
                        </Stat>
                    </CardBody>
                </Card>
            </Grid>

            <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={6}>
                {/* Weapon Types */}
                <Card>
                    <CardHeader>
                        <Heading size="md">Weapon Types</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={3} align="stretch">
                            {Object.entries(stats.weaponCounts).map(([type, count]) => (
                                <Box key={type}>
                                    <HStack justify="space-between" mb={1}>
                                        <HStack>
                                            <Text>{getWeaponTypeIcon(type)}</Text>
                                            <Text fontWeight="medium">{type}</Text>
                                        </HStack>
                                        <Badge colorScheme="blue">{count}</Badge>
                                    </HStack>
                                    <Progress
                                        value={(count / stats.total) * 100}
                                        size="sm"
                                        colorScheme="blue"
                                        borderRadius="md"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        {Math.round((count / stats.total) * 100)}% of total
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>

                {/* Threat Levels */}
                <Card>
                    <CardHeader>
                        <Heading size="md">Threat Level Distribution</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={3} align="stretch">
                            {Object.entries(stats.threatLevels).map(([level, count]) => (
                                <Box key={level}>
                                    <HStack justify="space-between" mb={1}>
                                        <Text fontWeight="medium" textTransform="capitalize">
                                            {level} Threat
                                        </Text>
                                        <Badge colorScheme={getThreatLevelColor(level)}>{count}</Badge>
                                    </HStack>
                                    <Progress
                                        value={stats.total > 0 ? (count / stats.total) * 100 : 0}
                                        size="sm"
                                        colorScheme={getThreatLevelColor(level)}
                                        borderRadius="md"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        {stats.total > 0 ? Math.round((count / stats.total) * 100) : 0}% of total
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>

                {/* Device Sources */}
                <Card>
                    <CardHeader>
                        <Heading size="md">Detection Sources</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={3} align="stretch">
                            {Object.entries(stats.deviceCounts).map(([device, count]) => (
                                <Box key={device}>
                                    <HStack justify="space-between" mb={1}>
                                        <Text fontWeight="medium">{device}</Text>
                                        <Badge colorScheme="green">{count}</Badge>
                                    </HStack>
                                    <Progress
                                        value={(count / stats.total) * 100}
                                        size="sm"
                                        colorScheme="green"
                                        borderRadius="md"
                                    />
                                    <Text fontSize="xs" color="gray.500" mt={1}>
                                        {Math.round((count / stats.total) * 100)}% of detections
                                    </Text>
                                </Box>
                            ))}
                        </VStack>
                    </CardBody>
                </Card>

                {/* Top Locations */}
                <Card>
                    <CardHeader>
                        <Heading size="md">Top Locations</Heading>
                    </CardHeader>
                    <CardBody>
                        <VStack spacing={3} align="stretch">
                            {Object.entries(stats.locationCounts)
                                .sort(([, a], [, b]) => b - a)
                                .slice(0, 5)
                                .map(([location, count]) => (
                                    <Box key={location}>
                                        <HStack justify="space-between" mb={1}>
                                            <Text fontWeight="medium" fontSize="sm">
                                                📍 {location}
                                            </Text>
                                            <Badge colorScheme="orange">{count}</Badge>
                                        </HStack>
                                        <Progress
                                            value={(count / stats.total) * 100}
                                            size="sm"
                                            colorScheme="orange"
                                            borderRadius="md"
                                        />
                                        <Text fontSize="xs" color="gray.500" mt={1}>
                                            {Math.round((count / stats.total) * 100)}% of detections
                                        </Text>
                                    </Box>
                                ))}
                        </VStack>
                    </CardBody>
                </Card>
            </Grid>
        </VStack>
    );
};

export default DetectionStats; 