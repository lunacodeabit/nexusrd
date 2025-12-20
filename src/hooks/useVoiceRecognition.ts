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
    maxAlternatives: number;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((event: SpeechRecognitionEvent) => void) | null;
    onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
    onstart: (() => void) | null;
    onspeechstart: (() => void) | null;
    onspeechend: (() => void) | null;
    onaudiostart: (() => void) | null;
    onaudioend: (() => void) | null;
}

declare global {
    interface Window {
        SpeechRecognition: new () => SpeechRecognition;
        webkitSpeechRecognition: new () => SpeechRecognition;
    }
}

interface UseVoiceRecognitionReturn {
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    interimTranscript: string;
    error: string | null;
    isSupported: boolean;
    start: () => void;
    stop: () => void;
    reset: () => void;
    retry: () => void;
}

// Configuration
const CONFIG = {
    LANG: 'es-DO', // Dominican Republic Spanish
    FALLBACK_LANG: 'es-ES', // Fallback to Spain Spanish
    SILENCE_TIMEOUT_MS: 8000, // How long to wait for speech
    SPEECH_END_DELAY_MS: 1500, // Delay after speech ends before stopping
    MAX_RETRIES: 2,
};

export function useVoiceRecognition(): UseVoiceRecognitionReturn {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const silenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const speechEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasSpokenRef = useRef(false);

    // Check if Web Speech API is supported
    const isSupported = typeof window !== 'undefined' &&
        ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    // Clear all timeouts
    const clearTimeouts = useCallback(() => {
        if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
        }
        if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
            speechEndTimeoutRef.current = null;
        }
    }, []);

    // Initialize recognition
    useEffect(() => {
        if (!isSupported) return;

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionAPI();

        // Configuration for voice command (not dictation)
        recognition.continuous = false; // Stop after first utterance
        recognition.interimResults = true; // Show partial results for better UX
        recognition.maxAlternatives = 1;

        // Try Dominican Spanish first, fall back to general Spanish
        recognition.lang = CONFIG.LANG;

        recognition.onstart = () => {
            console.log('🎤 Voice recognition started');
            setIsListening(true);
            setError(null);
            hasSpokenRef.current = false;

            // Set silence timeout - if no speech detected
            silenceTimeoutRef.current = setTimeout(() => {
                if (!hasSpokenRef.current && isListening) {
                    console.log('🎤 Silence timeout - no speech detected');
                    setError('No se detectó voz. Habla más cerca del micrófono.');
                    recognition.stop();
                }
            }, CONFIG.SILENCE_TIMEOUT_MS);
        };

        recognition.onspeechstart = () => {
            console.log('🎤 Speech started');
            setIsSpeaking(true);
            hasSpokenRef.current = true;
            clearTimeouts();
        };

        recognition.onspeechend = () => {
            console.log('🎤 Speech ended');
            setIsSpeaking(false);

            // Give a small delay before stopping to catch trailing words
            speechEndTimeoutRef.current = setTimeout(() => {
                recognition.stop();
            }, CONFIG.SPEECH_END_DELAY_MS);
        };

        recognition.onaudiostart = () => {
            console.log('🎤 Audio capture started');
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interim = '';

            // Clear silence timeout since we got results
            clearTimeouts();
            hasSpokenRef.current = true;

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                    console.log('🎤 Final transcript:', result[0].transcript, 'Confidence:', result[0].confidence);
                } else {
                    interim += result[0].transcript;
                }
            }

            if (finalTranscript) {
                // Replace transcript instead of accumulating (for voice commands)
                setTranscript(finalTranscript.trim());
                setInterimTranscript('');
            } else if (interim) {
                setInterimTranscript(interim);
            }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('🎤 Speech recognition error:', event.error);
            clearTimeouts();

            switch (event.error) {
                case 'no-speech':
                    // Only show error if user hasn't spoken at all
                    if (!hasSpokenRef.current) {
                        setError('No se detectó voz. Acércate al micrófono e intenta de nuevo.');
                    }
                    break;
                case 'audio-capture':
                    setError('No se encontró micrófono. Conecta uno e intenta de nuevo.');
                    break;
                case 'not-allowed':
                    setError('Permiso de micrófono denegado. Habilítalo en la configuración del navegador.');
                    break;
                case 'network':
                    setError('Error de red. Verifica tu conexión a internet.');
                    break;
                case 'aborted':
                    // User cancelled, don't show error
                    break;
                case 'service-not-allowed':
                    setError('El servicio de voz no está disponible. Intenta en Chrome.');
                    break;
                default:
                    setError(`Error de reconocimiento: ${event.error}`);
            }

            setIsListening(false);
            setIsSpeaking(false);
        };

        recognition.onend = () => {
            console.log('🎤 Voice recognition ended. Transcript:', transcript);
            clearTimeouts();
            setIsListening(false);
            setIsSpeaking(false);
        };

        recognitionRef.current = recognition;

        return () => {
            clearTimeouts();
            recognition.abort();
        };
    }, [isSupported, clearTimeouts]);

    const start = useCallback(() => {
        if (!recognitionRef.current) {
            setError('Reconocimiento de voz no disponible.');
            return;
        }

        if (isListening) {
            console.log('🎤 Already listening, ignoring start request');
            return;
        }

        // Reset state
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        setRetryCount(0);
        hasSpokenRef.current = false;

        try {
            console.log('🎤 Starting voice recognition...');
            recognitionRef.current.start();
        } catch (err) {
            console.error('🎤 Failed to start recognition:', err);

            // If already started, try stopping first then starting
            if (err instanceof Error && err.message.includes('already started')) {
                recognitionRef.current.stop();
                setTimeout(() => {
                    try {
                        recognitionRef.current?.start();
                    } catch (retryErr) {
                        setError('No se pudo iniciar el reconocimiento de voz.');
                    }
                }, 100);
            } else {
                setError('No se pudo iniciar el reconocimiento de voz. Recarga la página.');
            }
        }
    }, [isListening]);

    const stop = useCallback(() => {
        clearTimeouts();
        if (!recognitionRef.current || !isListening) return;

        console.log('🎤 Stopping voice recognition...');
        recognitionRef.current.stop();
    }, [isListening, clearTimeouts]);

    const reset = useCallback(() => {
        clearTimeouts();
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        setRetryCount(0);
        hasSpokenRef.current = false;

        if (recognitionRef.current && isListening) {
            recognitionRef.current.abort();
        }
    }, [isListening, clearTimeouts]);

    const retry = useCallback(() => {
        if (retryCount >= CONFIG.MAX_RETRIES) {
            setError('Demasiados intentos fallidos. Verifica tu micrófono.');
            return;
        }

        setRetryCount(prev => prev + 1);
        setError(null);

        // Small delay before retrying
        setTimeout(() => {
            start();
        }, 300);
    }, [retryCount, start]);

    return {
        isListening,
        isSpeaking,
        transcript,
        interimTranscript,
        error,
        isSupported,
        start,
        stop,
        reset,
        retry,
    };
}
