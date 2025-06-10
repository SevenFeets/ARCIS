import React, { useState, useEffect } from 'react';
import { Container, useToast, useColorModeValue, useDisclosure } from '@chakra-ui/react';
import { detectionsAPI, Detection, ManualDetection } from '../api/detections';
import SystemMetricsModal from '../components/dashboard/SystemMetricsModal';
import ExpandThreatModal from '../components/dashboard/ExpandThreatModal';


const DashboardPage: React.FC = () => {
    const [, setDetections] = useState<Detection[]>([]);
    const [, setManualDetections] = useState<ManualDetection[]>([]);
    const [threats, setThreats] = useState<Detection[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        threats: 0,
        manual: 0,
        lastHour: 0
    });
    const [selectedThreatForMetrics, setSelectedThreatForMetrics] = useState<number | null>(null);
    const [selectedThreatForExpand, setSelectedThreatForExpand] = useState<Detection | null>(null);

    const toast = useToast();
    const { isOpen: isMetricsOpen, onOpen: onMetricsOpen, onClose: onMetricsClose } = useDisclosure();
    const { isOpen: isExpandOpen, onOpen: onExpandOpen, onClose: onExpandClose } = useDisclosure();

    // Theme-aware colors (using actual CSS color values for inline styles)
    const cardBg = useColorModeValue('#ffffff', '#2D3748');
    const cardBorder = useColorModeValue('#e0e0e0', '#4A5568');
    const textColor = useColorModeValue('#1A202C', '#F7FAFC');
    const threatCardBg = useColorModeValue('#ffffff', '#2D3748');
    const threatBorder = useColorModeValue('#dc3545', '#ff6b6b');
    const threatTitle = useColorModeValue('#dc3545', '#ff6b6b');
    const sectionBg = useColorModeValue('#f8f9fa', '#4A5568');
    const buttonBg = useColorModeValue('#f8f9fa', '#4A5568');
    const buttonBorder = useColorModeValue('#dee2e6', '#718096');

    // Fetch all dashboard data
    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            console.log('Testing API connection...');
            const testResult = await detectionsAPI.testConnection();
            console.log('API Test Result:', testResult.data);

            const [allDetections, manualEntries, currentThreats] = await Promise.all([
                detectionsAPI.getAll(),
                detectionsAPI.getManual(),
                detectionsAPI.getThreats()
            ]);

            setDetections(allDetections.data.data);
            setManualDetections(manualEntries.data.data);
            setThreats(currentThreats.data.active_weapon_threats);

            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const recentDetections = allDetections.data.data.filter(
                d => new Date(d.timestamp) > oneHourAgo
            );

            setStats({
                total: allDetections.data.total,
                threats: currentThreats.data.threat_count,
                manual: manualEntries.data.count,
                lastHour: recentDetections.length
            });

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast({
                title: 'Error Loading Dashboard',
                description: 'Failed to fetch detection data from server',
                status: 'error',
                duration: 5000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto-refresh data every 120 seconds (2 minutes)
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 120000);
        return () => clearInterval(interval);
    }, []);

    // Handler functions for modals
    const handleShowMetrics = (threatId: number) => {
        console.log('Opening metrics modal for threat ID:', threatId);
        setSelectedThreatForMetrics(threatId);
        onMetricsOpen();
    };

    const handleExpandThreat = (threat: Detection) => {
        console.log('Opening expand modal for threat:', threat);
        setSelectedThreatForExpand(threat);
        onExpandOpen();
    };

    // Loading state
    if (loading) {
        return (
            <Container maxW="container.xl" py={8}>
                <div>Loading ARCIS Dashboard...</div>
            </Container>
        );
    }

    // Render header section
    const renderHeader = () => (
        <div key="header-section" style={{ marginBottom: '20px' }}>
            <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>
                🛡️ ARCIS Weapon Detection System
            </h1>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '15px' }}>
                Real-time monitoring and threat assessment dashboard
            </p>
            <button
                onClick={fetchDashboardData}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                🕒 Refresh Dashboard
            </button>
        </div>
    );

    // Render threat alert
    const renderThreatAlert = () => {
        if (threats.length === 0) return null;

        return (
            <div
                key="threat-alert-section"
                style={{
                    background: '#ff6b35',
                    color: 'white',
                    padding: '15px',
                    margin: '20px 0',
                    borderRadius: '8px',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }}
            >
                ⚠️ {threats.length} Active Weapon Threat{threats.length > 1 ? 's' : ''} Detected!
            </div>
        );
    };

    // Render stats grid
    const renderStatsGrid = () => (
        <div key="stats-section" style={{ marginBottom: '30px' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
            }}>
                <div style={{ border: `2px solid ${cardBorder}`, backgroundColor: cardBg, padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: textColor, marginBottom: '8px' }}>
                        Total Detections
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196f3', marginBottom: '5px' }}>
                        {stats.total}
                    </div>
                    <div style={{ fontSize: '12px', color: textColor, opacity: 0.7 }}>
                        👁️ All time
                    </div>
                </div>

                <div style={{ border: `2px solid ${cardBorder}`, backgroundColor: cardBg, padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: textColor, marginBottom: '8px' }}>
                        Active Threats
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f44336', marginBottom: '5px' }}>
                        {stats.threats}
                    </div>
                    <div style={{ fontSize: '12px', color: textColor, opacity: 0.7 }}>
                        ⚠️ High priority
                    </div>
                </div>

                <div style={{ border: `2px solid ${cardBorder}`, backgroundColor: cardBg, padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: textColor, marginBottom: '8px' }}>
                        Manual Entries
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '5px' }}>
                        {stats.manual}
                    </div>
                    <div style={{ fontSize: '12px', color: textColor, opacity: 0.7 }}>
                        👮 Officer reports
                    </div>
                </div>

                <div style={{ border: `2px solid ${cardBorder}`, backgroundColor: cardBg, padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: textColor, marginBottom: '8px' }}>
                        Last Hour
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4caf50', marginBottom: '5px' }}>
                        {stats.lastHour}
                    </div>
                    <div style={{ fontSize: '12px', color: textColor, opacity: 0.7 }}>
                        🤖 Recent activity
                    </div>
                </div>
            </div>
        </div>
    );

    // Render navigation tabs
    const renderNavigationTabs = () => (
        <div key="navigation-section" style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '15px', color: textColor }}>Dashboard Navigation</h2>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button style={{
                    padding: '10px 15px',
                    backgroundColor: buttonBg,
                    border: `1px solid ${buttonBorder}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: textColor
                }}>
                    📊 Recent Detections
                </button>
                <button style={{
                    padding: '10px 15px',
                    backgroundColor: buttonBg,
                    border: `1px solid ${buttonBorder}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: textColor
                }}>
                    🔍 Threat Analysis
                </button>
                <button style={{
                    padding: '10px 15px',
                    backgroundColor: buttonBg,
                    border: `1px solid ${buttonBorder}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: textColor
                }}>
                    📝 Manual Entries
                </button>
                <button style={{
                    padding: '10px 15px',
                    backgroundColor: buttonBg,
                    border: `1px solid ${buttonBorder}`,
                    borderRadius: '5px',
                    cursor: 'pointer',
                    color: textColor
                }}>
                    📈 Statistics
                </button>
            </div>
        </div>
    );

    // Render threats list
    const renderThreatsList = () => (
        <div key="threats-list-section">
            <h3 style={{ fontSize: '20px', marginBottom: '15px', color: textColor }}>
                🛡️ High Priority Threats ({threats.length})
            </h3>
            <div style={{
                padding: '20px',
                backgroundColor: sectionBg,
                borderRadius: '8px',
                border: `1px solid ${cardBorder}`
            }}>
                {threats.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#28a745', fontSize: '18px' }}>
                        ✅ No active threats detected
                    </div>
                ) : (
                    <div>
                        {threats.map((threat, index) => {
                            const threatId = threat.detection_id || threat.id;
                            console.log('Rendering threat:', { threat, threatId });
                            return (
                                <div
                                    key={`threat-${threatId || index}`}
                                    style={{
                                        border: `2px solid ${threatBorder}`,
                                        backgroundColor: threatCardBg,
                                        margin: '10px 0',
                                        padding: '15px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '10px', color: threatTitle }}>
                                        {threat.weapon_type} - Threat Level {threat.threat_level}
                                    </div>
                                    <div style={{ marginBottom: '5px', color: textColor }}>
                                        📍 <strong>Location:</strong> {threat.location || 'Unknown'}
                                    </div>
                                    <div style={{ marginBottom: '5px', color: textColor }}>
                                        🕒 <strong>Time:</strong> {new Date(threat.timestamp).toLocaleString()}
                                    </div>
                                    <div style={{ marginBottom: '5px', color: textColor }}>
                                        📱 <strong>Device:</strong> {threat.device} ({threat.device_id})
                                    </div>
                                    <div style={{ color: textColor }}>
                                        🎯 <strong>Confidence:</strong> {threat.confidence}%
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => handleShowMetrics(threatId)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            📊 System Metrics
                                        </button>
                                        <button
                                            onClick={() => handleExpandThreat({ ...threat, id: threatId })}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            🔍 Expand Threat
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );

    // Main render
    return (
        <Container maxW="container.xl" py={8}>
            <div>
                {renderHeader()}
                {renderThreatAlert()}
                {renderStatsGrid()}
                {renderNavigationTabs()}
                {renderThreatsList()}
            </div>



            {/* Modal Components */}
            {selectedThreatForMetrics && isMetricsOpen && (
                <SystemMetricsModal
                    isOpen={isMetricsOpen}
                    onClose={() => {
                        console.log('Closing metrics modal');
                        setSelectedThreatForMetrics(null);
                        onMetricsClose();
                    }}
                    detectionId={selectedThreatForMetrics}
                />
            )}

            {selectedThreatForExpand && isExpandOpen && (
                <ExpandThreatModal
                    isOpen={isExpandOpen}
                    onClose={() => {
                        console.log('Closing expand modal');
                        setSelectedThreatForExpand(null);
                        onExpandClose();
                    }}
                    threat={selectedThreatForExpand}
                />
            )}
        </Container>
    );
};

export default DashboardPage; 