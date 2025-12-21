import { useState, useCallback, useEffect } from 'react';
import { Mic, MicOff, X, Check, Loader2, Calendar, User, Clock, MapPin, AlertCircle, RefreshCw } from 'lucide-react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Types for parsed command
interface ParsedCommand {
    action: 'create_appointment' | 'create_task' | 'search_lead' | 'unknown';
    lead_name: string | null;
    date: string | null;
    time: string | null;
    appointment_type: 'virtual' | 'in_person' | null;
    task_type: 'call' | 'whatsapp' | 'visit' | 'email' | 'other';
    notes: string | null;
    confidence: number;
    error?: string;
}

type AssistantState = 'idle' | 'listening' | 'processing' | 'confirming' | 'success' | 'error';

// Matched lead type
interface MatchedLead {
    id: string;
    name: string;
    phone: string;
}

export default function VoiceAssistant() {
    const { user } = useAuth();
    const { isListening, isSpeaking, transcript, interimTranscript, error: voiceError, isSupported, start, stop, reset, retry } = useVoiceRecognition();

    const [state, setState] = useState<AssistantState>('idle');
    const [isOpen, setIsOpen] = useState(false);
    const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
    const [matchedLead, setMatchedLead] = useState<MatchedLead | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Don't render if not logged in
    if (!user) {
        return null;
    }

    // Handle listening state changes
    useEffect(() => {
        if (isListening) {
            setState('listening');
        }
    }, [isListening]);

    // Process transcript when speaking stops
    useEffect(() => {
        if (!isListening && transcript && state === 'listening') {
            processTranscript(transcript);
        }
    }, [isListening, transcript, state]);

    // Handle voice errors
    useEffect(() => {
        if (voiceError) {
            setError(voiceError);
            setState('error');
        }
    }, [voiceError]);

    // Parse the voice command using Gemini
    const processTranscript = async (text: string) => {
        setState('processing');
        setError(null);

        try {
            console.log('🎤 Processing transcript:', text);

            const response = await fetch('/.netlify/functions/parse-voice-command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transcript: text }),
            });

            const responseData = await response.json();
            console.log('🎤 API Response:', responseData);

            if (!response.ok) {
                // Show specific error from API
                const errorMsg = responseData.error || responseData.details || 'Error del servidor';
                console.error('🎤 API Error:', errorMsg);
                throw new Error(errorMsg);
            }

            const parsed: ParsedCommand = responseData;

            if (parsed.error || parsed.action === 'unknown') {
                setError(parsed.error || 'No entendí el comando. Intenta de nuevo.');
                setState('error');
                return;
            }

            setParsedCommand(parsed);

            // Try to find matching lead
            if (parsed.lead_name && user) {
                const { data: leads } = await supabase
                    .from('leads')
                    .select('id, name, phone')
                    .eq('user_id', user.id)
                    .ilike('name', `%${parsed.lead_name}%`)
                    .limit(1);

                if (leads && leads.length > 0) {
                    setMatchedLead(leads[0]);
                }
            }

            setState('confirming');
        } catch (err) {
            console.error('🎤 Error processing command:', err);
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(`Error: ${errorMessage}`);
            setState('error');
        }
    };

    // Create the appointment/task
    const handleConfirm = async () => {
        if (!parsedCommand || !user) return;

        setState('processing');

        try {
            // Map task_type to method format expected by Dashboard
            const methodMap: Record<string, 'LLAMADA' | 'WHATSAPP' | 'EMAIL' | 'VISITA' | 'OTRO'> = {
                'call': 'LLAMADA',
                'whatsapp': 'WHATSAPP',
                'email': 'EMAIL',
                'visit': 'VISITA',
                'other': 'OTRO',
            };

            const taskData = {
                user_id: user.id,
                lead_id: matchedLead?.id || null,
                lead_name: matchedLead?.name || parsedCommand.lead_name || 'Sin nombre',
                lead_phone: matchedLead?.phone || null,
                task_type: parsedCommand.task_type === 'visit' ? 'visit' : parsedCommand.task_type,
                appointment_type: parsedCommand.appointment_type,
                scheduled_date: parsedCommand.date || new Date().toISOString().split('T')[0],
                scheduled_time: parsedCommand.time || '09:00',
                notes: parsedCommand.notes,
                is_completed: false,
                alert_sent: false,
            };

            // 1. Save to Supabase
            const { data: insertedTask, error: insertError } = await supabase
                .from('scheduled_tasks')
                .insert(taskData)
                .select()
                .single();

            if (insertError) throw insertError;

            // 2. Also save to localStorage for Dashboard compatibility
            const localStorageTask = {
                id: insertedTask?.id || crypto.randomUUID(),
                leadId: matchedLead?.id || '',
                leadName: matchedLead?.name || parsedCommand.lead_name || 'Sin nombre',
                method: methodMap[parsedCommand.task_type] || 'OTRO',
                scheduledDate: parsedCommand.date || new Date().toISOString().split('T')[0],
                scheduledTime: parsedCommand.time || '09:00',
                notes: parsedCommand.notes || '',
                completed: false,
                alertMinutesBefore: 15,
                alertSent: false,
            };

            const saved = localStorage.getItem('nexus_scheduled_tasks');
            const existingTasks = saved ? JSON.parse(saved) : [];
            existingTasks.push(localStorageTask);
            localStorage.setItem('nexus_scheduled_tasks', JSON.stringify(existingTasks));

            // Dispatch storage event to notify Dashboard
            window.dispatchEvent(new Event('storage'));

            setState('success');

            // Auto close after success
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err) {
            console.error('Error creating task:', err);
            setError('Error al crear la tarea.');
            setState('error');
        }
    };

    // Open the assistant
    const handleOpen = useCallback(() => {
        setIsOpen(true);
        reset();
        setParsedCommand(null);
        setMatchedLead(null);
        setError(null);
        setState('idle');
    }, [reset]);

    // Close the assistant
    const handleClose = useCallback(() => {
        stop();
        setIsOpen(false);
        reset();
        setParsedCommand(null);
        setMatchedLead(null);
        setError(null);
        setState('idle');
    }, [stop, reset]);

    // Start listening
    const handleStartListening = useCallback(() => {
        reset();
        setError(null);
        start();
    }, [start, reset]);

    // Stop listening and immediately process transcript
    const handleStopAndProcess = useCallback(() => {
        stop();
        // Small delay to let React update the transcript state
        setTimeout(() => {
            // We need to get the latest transcript from the DOM since React state might be stale
            // The transcript is shown in the UI, so it should be current after the delay
            const currentTranscript = transcript || interimTranscript;
            console.log('🎤 Processing after stop:', currentTranscript);
            if (currentTranscript && (state === 'listening' || state === 'idle')) {
                processTranscript(currentTranscript);
            }
        }, 200);
    }, [stop, transcript, interimTranscript, state]);

    // Retry - uses intelligent retry from hook
    const handleRetry = useCallback(() => {
        reset();
        setParsedCommand(null);
        setMatchedLead(null);
        setError(null);
        setState('idle');
        // Use retry from hook if we're retrying from an error
        retry();
    }, [reset, retry]);

    // Format date for display
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.getTime() === today.getTime()) return 'Hoy';
        if (date.getTime() === tomorrow.getTime()) return 'Mañana';

        return date.toLocaleDateString('es-DO', { weekday: 'long', day: 'numeric', month: 'short' });
    };

    // Format time for display
    const formatTime = (timeStr: string) => {
        if (!timeStr) return 'Hora no especificada';

        // If already contains AM/PM, return as is
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
            return timeStr;
        }

        // Handle various formats: "9", "09:00", "9:00", "09:30"
        const parts = timeStr.split(':');
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1] || '0', 10);

        // Check for invalid parsing
        if (isNaN(hours)) return timeStr; // Return original if can't parse

        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        const minutesStr = isNaN(minutes) ? '00' : minutes.toString().padStart(2, '0');

        return `${hours12}:${minutesStr} ${period}`;
    };

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={handleOpen}
                className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-purple-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
                title="Asistente de voz"
                style={{ backgroundColor: '#9333ea' }}
            >
                <Mic className="w-6 h-6 text-white" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                    <Mic className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold text-white">Asistente ALVEARE</span>
                            </div>
                            <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Not Supported State */}
                            {!isSupported && (
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-yellow-500/20 flex items-center justify-center">
                                        <AlertCircle className="w-12 h-12 text-yellow-400" />
                                    </div>
                                    <p className="text-yellow-400 font-medium">Navegador no soportado</p>
                                    <p className="text-gray-400 text-sm">El reconocimiento de voz requiere Chrome, Edge o Safari.</p>
                                </div>
                            )}

                            {/* Idle State */}
                            {isSupported && state === 'idle' && (
                                <div className="text-center space-y-4">
                                    <button
                                        onClick={handleStartListening}
                                        className="w-24 h-24 mx-auto rounded-full bg-purple-600 flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                                    >
                                        <Mic className="w-10 h-10 text-white" />
                                    </button>
                                    <p className="text-gray-400 text-sm">
                                        Toca para hablar
                                    </p>

                                    {/* Command Examples */}
                                    <div className="mt-4 p-3 bg-gray-900/50 rounded-lg text-left">
                                        <p className="text-xs text-purple-400 font-medium mb-2 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> Ejemplos de comandos:
                                        </p>
                                        <ul className="space-y-1.5 text-xs text-gray-400">
                                            <li className="flex items-start gap-2">
                                                <span className="text-green-400">•</span>
                                                <span>"Agenda cita <b className="text-white">mañana a las 3pm</b> con <b className="text-white">Juan</b>, <b className="text-white">presencial</b>"</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-blue-400">•</span>
                                                <span>"Llamar a <b className="text-white">María</b> <b className="text-white">dentro de 1 hora</b>"</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-yellow-400">•</span>
                                                <span>"Recordarme enviar contrato el <b className="text-white">lunes</b> a las <b className="text-white">10am</b>"</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Listening State */}
                            {state === 'listening' && (
                                <div className="text-center space-y-4">
                                    <div className="relative w-24 h-24 mx-auto">
                                        <button
                                            onClick={handleStopAndProcess}
                                            className={`w-full h-full rounded-full flex items-center justify-center shadow-lg transition-all ${isSpeaking
                                                ? 'bg-green-500 scale-110'
                                                : 'bg-red-500 animate-pulse'
                                                }`}
                                        >
                                            {isSpeaking ? (
                                                <Mic className="w-10 h-10 text-white animate-bounce" />
                                            ) : (
                                                <MicOff className="w-10 h-10 text-white" />
                                            )}
                                        </button>
                                        <div className={`absolute inset-0 rounded-full border-4 animate-ping opacity-30 ${isSpeaking ? 'border-green-500' : 'border-red-500'
                                            }`} />
                                        {/* Audio wave animation when speaking */}
                                        {isSpeaking && (
                                            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                                                <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                                                <div className="w-1 h-6 bg-green-400 rounded animate-pulse" style={{ animationDelay: '100ms' }} />
                                                <div className="w-1 h-8 bg-green-400 rounded animate-pulse" style={{ animationDelay: '200ms' }} />
                                                <div className="w-1 h-6 bg-green-400 rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                                                <div className="w-1 h-4 bg-green-400 rounded animate-pulse" style={{ animationDelay: '400ms' }} />
                                            </div>
                                        )}
                                    </div>
                                    <p className={`font-medium ${isSpeaking ? 'text-green-400' : 'text-white'}`}>
                                        {isSpeaking ? '🎙️ Te escucho...' : 'Escuchando...'}
                                    </p>
                                    <p className="text-gray-400 text-sm min-h-[3rem]">
                                        {interimTranscript || transcript || (isSpeaking ? '' : 'Habla ahora...')}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        Toca el micrófono para detener
                                    </p>
                                </div>
                            )}

                            {/* Processing State */}
                            {state === 'processing' && (
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                                    </div>
                                    <p className="text-white font-medium">Procesando...</p>
                                    <p className="text-gray-500 text-sm">{transcript}</p>
                                </div>
                            )}

                            {/* Confirming State */}
                            {state === 'confirming' && parsedCommand && (
                                <div className="space-y-4">
                                    <p className="text-center text-gray-400 text-sm mb-4">¿Crear esta tarea?</p>

                                    <div className="bg-gray-900 rounded-xl p-4 space-y-3">
                                        {/* Lead */}
                                        <div className="flex items-center gap-3">
                                            <User className="w-5 h-5 text-blue-400" />
                                            <div>
                                                <p className="text-white font-medium">
                                                    {matchedLead?.name || parsedCommand.lead_name || 'Sin nombre'}
                                                </p>
                                                {matchedLead && (
                                                    <p className="text-xs text-green-400">✓ Lead encontrado</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Date */}
                                        {parsedCommand.date && (
                                            <div className="flex items-center gap-3">
                                                <Calendar className="w-5 h-5 text-white" />
                                                <p className="text-white">{formatDate(parsedCommand.date)}</p>
                                            </div>
                                        )}

                                        {/* Time */}
                                        {parsedCommand.time && (
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-5 h-5 text-white" />
                                                <p className="text-white">{formatTime(parsedCommand.time)}</p>
                                            </div>
                                        )}

                                        {/* Type */}
                                        {parsedCommand.appointment_type && (
                                            <div className="flex items-center gap-3">
                                                <MapPin className="w-5 h-5 text-green-400" />
                                                <p className="text-white">
                                                    {parsedCommand.appointment_type === 'virtual' ? '🖥️ Virtual' : '🏠 Presencial'}
                                                </p>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {parsedCommand.notes && (
                                            <p className="text-gray-400 text-sm border-t border-white/10 pt-3">
                                                📝 {parsedCommand.notes}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleRetry}
                                            className="flex-1 py-3 rounded-xl bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            Reintentar
                                        </button>
                                        <button
                                            onClick={handleConfirm}
                                            className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-500 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Success State */}
                            {state === 'success' && (
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Check className="w-12 h-12 text-green-400" />
                                    </div>
                                    <p className="text-green-400 font-bold text-lg">¡Tarea creada!</p>
                                </div>
                            )}

                            {/* Error State */}
                            {state === 'error' && (
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                                        <AlertCircle className="w-12 h-12 text-red-400" />
                                    </div>
                                    <p className="text-red-400 font-medium">{error || 'Algo salió mal'}</p>
                                    <button
                                        onClick={handleRetry}
                                        className="px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                                    >
                                        Intentar de nuevo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
