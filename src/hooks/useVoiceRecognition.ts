import { useState, useCallback, useRef, useEffect } from 'react';

// SpeechRecognition types for TypeScript
interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    error: string | null;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
}

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<SpeechRecognition | null>(null);

    // Check if Web Speech API is supported
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Initialize recognition
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();

        recognition.continuous = false; // Stop after one utterance
        recognition.interimResults = true; // Show partial results
        recognition.lang = 'es-DO'; // Spanish (Dominican Republic)

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interim = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interim += result[0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(prev => prev + finalTranscript);
                setInterimTranscript('');
            } else {
                setInterimTranscript(interim);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);

            switch (event.error) {
                case 'no-speech':
                    setError('No se detectó voz. Intenta de nuevo.');
                    break;
                case 'audio-capture':
                    setError('No se encontró micrófono.');
                    break;
                case 'not-allowed':
                    setError('Permiso de micrófono denegado.');
                    break;
                case 'network':
                    setError('Error de red. Verifica tu conexión.');
                    break;
                default:
                    setError(`Error: ${event.error}`);
            }

            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.abort();
        };
    }, [isSupported]);

    const start = useCallback(() => {
        if (!recognitionRef.current || isListening) return;

        setTranscript('');
        setInterimTranscript('');
        setError(null);

        try {
            recognitionRef.current.start();
        } catch (err) {
            console.error('Failed to start recognition:', err);
            setError('No se pudo iniciar el reconocimiento de voz.');
        }
    }, [isListening]);

    const stop = useCallback(() => {
        if (!recognitionRef.current || !isListening) return;
        recognitionRef.current.stop();
    }, [isListening]);

    const reset = useCallback(() => {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
    }, []);

    return {
        isListening,
        transcript,
        interimTranscript,
        error,
        isSupported,
        start,
        stop,
        reset,
    };
}
