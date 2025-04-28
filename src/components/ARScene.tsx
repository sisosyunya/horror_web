import React, { useEffect, useRef } from 'react';

interface ARSceneProps {
    onSoundDetected: () => void;
}

const ARScene: React.FC<ARSceneProps> = ({ onSoundDetected }) => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);

    useEffect(() => {
        const initAudio = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();

                const source = audioContextRef.current.createMediaStreamSource(stream);
                source.connect(analyserRef.current);

                analyserRef.current.fftSize = 256;
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

                const checkVolume = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArray);
                        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;

                        if (average > 50) {
                            onSoundDetected();
                        }
                    }
                    requestAnimationFrame(checkVolume);
                };

                checkVolume();
            } catch (error) {
                console.error('マイクのアクセスに失敗しました:', error);
            }
        };

        initAudio();

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [onSoundDetected]);

    return (
        <a-scene
            embedded
            arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono; matrixCodeType: 3x3;"
        >
            <a-marker preset="hiro">
                <a-box position="0 0.5 0" material="color: red;"></a-box>
            </a-marker>
            <a-entity camera></a-entity>
        </a-scene>
    );
};

export default ARScene; 