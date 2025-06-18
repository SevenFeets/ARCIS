import React, { useState } from 'react';
import { detectionsAPI } from '../../api/detections';

const QuickApiTest: React.FC = () => {
    const [result, setResult] = useState<string>('');

    const testMetricsAPI = async () => {
        try {
            setResult('Testing metrics API...');
            // Test with a known detection ID
            const response = await detectionsAPI.getSystemMetrics(43);
            setResult(`✅ Metrics API Success: ${JSON.stringify(response.data, null, 2)}`);
        } catch (error) {
            setResult(`❌ Metrics API Error: ${error}`);
        }
    };

    const testFrameAPI = async () => {
        try {
            setResult('Testing frame API...');
            // Test with a known detection ID
            const response = await detectionsAPI.getDetectionFrame(43);
            setResult(`✅ Frame API Success: Frame data length ${response.data.frame_data.length} characters`);
        } catch (error) {
            setResult(`❌ Frame API Error: ${error}`);
        }
    };

    const testThreatsAPI = async () => {
        try {
            setResult('Testing threats API...');
            const response = await detectionsAPI.getThreats();
            setResult(`✅ Threats API Success: ${response.data.threat_count} threats, ${response.data.active_weapon_threats.length} active`);
        } catch (error) {
            setResult(`❌ Threats API Error: ${error}`);
        }
    };

    return (
        <div style={{ position: 'fixed', top: '100px', right: '20px', background: 'white', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', zIndex: 9999, maxWidth: '400px' }}>
            <h4>🛠️ Quick API Test</h4>
            <div style={{ marginBottom: '10px' }}>
                <button onClick={testThreatsAPI} style={{ margin: '2px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}>
                    Test Threats
                </button>
                <button onClick={testMetricsAPI} style={{ margin: '2px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px' }}>
                    Test Metrics
                </button>
                <button onClick={testFrameAPI} style={{ margin: '2px', padding: '5px 10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '3px' }}>
                    Test Frame
                </button>
            </div>
            <pre style={{ fontSize: '12px', maxHeight: '200px', overflow: 'auto', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                {result}
            </pre>
        </div>
    );
};

export default QuickApiTest; 