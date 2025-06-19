import React from 'react';
import { Detection } from '../../api/detections';

interface ThreatAlertsProps {
    threats: Detection[];
    onRefresh: () => void;
}

const ThreatAlerts: React.FC<ThreatAlertsProps> = ({ threats, onRefresh }) => {
    return (
        <div>
            <h3>High Priority Threats ({threats.length})</h3>
            <button onClick={onRefresh}>Refresh</button>

            {threats.length === 0 ? (
                <p>No threats detected</p>
            ) : (
                threats.map((threat) => (
                    <div key={threat.id} style={{ border: '1px solid red', margin: '10px', padding: '10px' }}>
                        <strong>{threat.weapon_type} - Level {threat.threat_level}</strong>
                        <br />
                        Location: {threat.location || 'Unknown'}
                        <br />
                        Time: {new Date(threat.timestamp).toLocaleString()}
                    </div>
                ))
            )}
        </div>
    );
};

export default ThreatAlerts; 