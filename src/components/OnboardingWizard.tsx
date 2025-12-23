import { useState } from 'react';
import {
    ChevronRight, ChevronLeft, Mic, Users, Calendar,
    TrendingUp, Bell, MessageSquare, CheckCircle2, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface OnboardingStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    tips: string[];
}

const ONBOARDING_STEPS: OnboardingStep[] = [
    {
        id: 'welcome',
        title: '¡Bienvenido a ALVEARE CRM!',
        description: 'Tu centro de comando para gestionar leads inmobiliarios de forma inteligente.',
        icon: <Sparkles className="w-12 h-12 text-yellow-400" />,
        tips: [
            'Este CRM está diseñado para agentes inmobiliarios',
            'Recibe leads automáticamente desde AlterEstate',
            'Recibe alertas por Telegram para nunca perder una oportunidad'
        ]
    },
    {
        id: 'leads',
        title: 'Gestión de Leads',
        description: 'Organiza tus prospectos en un tablero Kanban visual.',
        icon: <Users className="w-12 h-12 text-blue-400" />,
        tips: [
            'Arrastra leads entre columnas para cambiar su estado',
            'Califica leads con el sistema BANT integrado',
            'Registra cada seguimiento para no olvidar nada'
        ]
    },
    {
        id: 'calendar',
        title: 'Calendario de Citas',
        description: 'Agenda citas y recibe recordatorios automáticos.',
        icon: <Calendar className="w-12 h-12 text-purple-400" />,
        tips: [
            'Programa citas directamente desde el perfil del lead',
            'Elige entre citas virtuales o presenciales',
            'Recibe alertas 15 minutos antes por Telegram'
        ]
    },
    {
        id: 'voice',
        title: 'Asistente de Voz',
        description: 'Crea citas y tareas usando solo tu voz.',
        icon: <Mic className="w-12 h-12 text-pink-400" />,
        tips: [
            'Toca el botón morado 🎤 en la esquina inferior',
            'Di: "Agenda cita mañana a las 3pm con Juan, presencial"',
            'Funciona en español y es súper rápido'
        ]
    },
    {
        id: 'tracking',
        title: 'Seguimiento 12-Touch',
        description: 'El sistema de 12 contactos que maximiza conversiones.',
        icon: <TrendingUp className="w-12 h-12 text-green-400" />,
        tips: [
            'Cada lead tiene 12 oportunidades de seguimiento',
            'Registra el resultado de cada contacto',
            'Los leads con más seguimientos tienen 21x más conversión'
        ]
    },
    {
        id: 'alerts',
        title: 'Alertas Inteligentes',
        description: 'Nunca pierdas un lead por falta de seguimiento.',
        icon: <Bell className="w-12 h-12 text-orange-400" />,
        tips: [
            'Alerta a las 2h si no contactas un lead nuevo',
            'Alerta urgente a las 24h si sigue sin contactar',
            'Resumen diario a las 8am con tu agenda'
        ]
    },
    {
        id: 'telegram',
        title: 'Configura Telegram',
        description: 'Conecta tu Telegram para recibir alertas.',
        icon: <MessageSquare className="w-12 h-12 text-cyan-400" />,
        tips: [
            '1. Busca @CRMAlveareBot en Telegram',
            '2. Envía /start para obtener tu Chat ID',
            '3. Ve a tu perfil y activa las alertas'
        ]
    },
    {
        id: 'done',
        title: '¡Listo para empezar!',
        description: 'Ya conoces las funciones principales. ¡A vender!',
        icon: <CheckCircle2 className="w-12 h-12 text-green-400" />,
        tips: [
            'El Dashboard es tu centro de operaciones',
            'Usa el Voice Assistant para crear tareas rápido',
            '¿Dudas? Contacta al administrador'
        ]
    }
];

interface OnboardingWizardProps {
    onComplete: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
    const { user } = useAuth();
    const [currentStep, setCurrentStep] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    const step = ONBOARDING_STEPS[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            handleComplete();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleComplete = async () => {
        if (user) {
            await supabase
                .from('user_profiles')
                .update({ onboarding_completed: true, onboarding_completed_at: new Date().toISOString() })
                .eq('id', user.id);
        }

        setIsVisible(false);
        setTimeout(onComplete, 300);
    };

    const handleSkip = () => {
        handleComplete();
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden">
                {/* Progress Bar */}
                <div className="h-1 bg-gray-700">
                    <div
                        className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <span className="text-xs text-gray-500">
                        Paso {currentStep + 1} de {ONBOARDING_STEPS.length}
                    </span>
                    <button
                        onClick={handleSkip}
                        className="text-gray-500 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10 transition-colors"
                    >
                        Saltar tutorial
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                        {step.icon}
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
                    <p className="text-gray-400 mb-6">{step.description}</p>

                    <div className="bg-black/30 rounded-xl p-4 text-left space-y-3">
                        {step.tips.map((tip, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-yellow-400 text-xs font-bold">{index + 1}</span>
                                </div>
                                <p className="text-gray-300 text-sm">{tip}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
                    <button
                        onClick={handlePrev}
                        disabled={isFirstStep}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${isFirstStep
                                ? 'text-gray-600 cursor-not-allowed'
                                : 'text-gray-400 hover:text-white hover:bg-white/10'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Anterior
                    </button>

                    <div className="flex gap-1.5">
                        {ONBOARDING_STEPS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentStep(index)}
                                className={`w-2 h-2 rounded-full transition-all ${index === currentStep
                                        ? 'bg-yellow-400 w-4'
                                        : index < currentStep
                                            ? 'bg-green-500'
                                            : 'bg-gray-600'
                                    }`}
                            />
                        ))}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold rounded-lg hover:opacity-90 transition-opacity"
                    >
                        {isLastStep ? '¡Empezar!' : 'Siguiente'}
                        {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    );
}
