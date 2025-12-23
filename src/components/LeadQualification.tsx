import React, { useState, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CheckCircle, BarChart3, MessageSquare, Save, X } from 'lucide-react';
import {
  QUALIFICATION_QUESTIONS,
  calculateLeadScore,
  getScoreColor,
  getScoreEmoji,
  type QualificationAnswers,
  type LeadScore
} from '../services/leadScoring';
import { notificationSound } from '../services/notificationSound';

interface LeadQualificationProps {
  onComplete: (score: LeadScore) => void;
  onCancel: () => void;
  onSaveDraft?: (answers: QualificationAnswers, notes: Record<string, string>, progress: number) => void;
  leadName?: string;
  initialAnswers?: QualificationAnswers;
  initialNotes?: Record<string, string>;
}

const LeadQualification: React.FC<LeadQualificationProps> = ({
  onComplete,
  onCancel,
  onSaveDraft,
  leadName,
  initialAnswers,
  initialNotes
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<QualificationAnswers>(initialAnswers || {});
  const [notes, setNotes] = useState<Record<string, string>>(initialNotes || {});
  const [showResults, setShowResults] = useState(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState('');

  // Initialize with existing data
  useEffect(() => {
    if (initialAnswers) {
      setAnswers(initialAnswers);
    }
    if (initialNotes) {
      setNotes(initialNotes);
    }
  }, [initialAnswers, initialNotes]);

  // Filter questions based on conditionals
  const visibleQuestions = useMemo(() => {
    return QUALIFICATION_QUESTIONS.filter(question => {
      if (!question.conditional) return true;
      const dependsOnAnswer = answers[question.conditional.dependsOn];
      return question.conditional.showWhen.includes(dependsOnAnswer);
    });
  }, [answers]);

  const currentQuestion = visibleQuestions[currentStep];
  const progress = visibleQuestions.length > 0
    ? ((Object.keys(answers).filter(key =>
      visibleQuestions.some(q => q.id === key)
    ).length) / visibleQuestions.length) * 100
    : 0;
  const isLastQuestion = currentStep === visibleQuestions.length - 1;

  // Calculate how many questions are answered
  const answeredCount = Object.keys(answers).filter(key =>
    visibleQuestions.some(q => q.id === key)
  ).length;

  const handleSelectOption = (value: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: value
    }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
      // Play success sound when qualification is complete
      const score = calculateLeadScore(answers);
      if (score.category === 'HOT') {
        notificationSound.playUrgent();
      } else {
        notificationSound.playSuccess();
      }
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    const score = calculateLeadScore(answers);
    onComplete(score);
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) {
      onSaveDraft(answers, notes, Math.round(progress));
      notificationSound.playClick();
    }
  };

  const handleNoteToggle = (questionId: string) => {
    if (expandedNote === questionId) {
      // Save note before closing
      if (currentNoteText.trim()) {
        setNotes(prev => ({
          ...prev,
          [questionId]: currentNoteText.trim()
        }));
      }
      setExpandedNote(null);
      setCurrentNoteText('');
    } else {
      setExpandedNote(questionId);
      setCurrentNoteText(notes[questionId] || '');
    }
  };

  const handleNoteSave = () => {
    if (expandedNote && currentNoteText.trim()) {
      setNotes(prev => ({
        ...prev,
        [expandedNote]: currentNoteText.trim()
      }));
    }
    setExpandedNote(null);
    setCurrentNoteText('');
  };

  const handleJumpToQuestion = (index: number) => {
    if (index >= 0 && index < visibleQuestions.length) {
      // Save any open note first
      if (expandedNote && currentNoteText.trim()) {
        setNotes(prev => ({
          ...prev,
          [expandedNote]: currentNoteText.trim()
        }));
      }
      setExpandedNote(null);
      setCurrentNoteText('');
      setCurrentStep(index);
    }
  };

  const score = useMemo(() => calculateLeadScore(answers), [answers]);

  // Results view
  if (showResults) {
    return (
      <div className="space-y-6">
        {/* Score Header */}
        <div className="text-center py-6">
          <div className="text-6xl mb-4">{getScoreEmoji(score.category)}</div>
          <h3 className="text-2xl font-bold text-white mb-2">
            Lead Calificado: {score.category}
          </h3>
          <p className="text-gray-400">
            {leadName ? `${leadName} ha sido calificado` : 'Calificación completada'}
          </p>
        </div>

        {/* Score Display */}
        <div className="bg-nexus-base p-6 rounded-xl text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-white/10"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${score.percentage * 3.52} 352`}
                className={score.category === 'HOT' ? 'text-red-500' : score.category === 'WARM' ? 'text-yellow-500' : 'text-blue-500'}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{score.percentage}%</span>
            </div>
          </div>
          <p className="text-gray-400">
            {score.total} de {score.maxPossible} puntos posibles
          </p>
        </div>

        {/* Score Interpretation */}
        <div className={`p-4 rounded-lg border ${getScoreColor(score.category)}`}>
          {score.category === 'HOT' && (
            <div>
              <p className="font-bold">🔥 Lead Caliente - Prioridad Alta</p>
              <p className="text-sm mt-1 opacity-80">
                Este lead está listo para avanzar. Tiene financiamiento, presupuesto definido y quiere agendar cita. ¡Actúa rápido!
              </p>
            </div>
          )}
          {score.category === 'WARM' && (
            <div>
              <p className="font-bold">🟡 Lead Tibio - Seguimiento Activo</p>
              <p className="text-sm mt-1 opacity-80">
                Tiene interés real pero necesita más información o resolver algunos temas. Mantén contacto frecuente.
              </p>
            </div>
          )}
          {score.category === 'COLD' && (
            <div>
              <p className="font-bold">🔵 Lead Frío - Nurturing</p>
              <p className="text-sm mt-1 opacity-80">
                Está explorando opciones. Agrégalo a campañas de email y contenido educativo. Revisa en 2-3 meses.
              </p>
            </div>
          )}
        </div>

        {/* Summary of key answers */}
        <div className="bg-nexus-base p-4 rounded-lg">
          <h4 className="font-bold text-white mb-3 flex items-center gap-2">
            <BarChart3 size={18} className="text-nexus-accent" />
            Resumen de Respuestas Clave
          </h4>
          <div className="space-y-2 text-sm">
            {visibleQuestions.slice(0, 5).map(q => {
              const answer = answers[q.id];
              const option = q.options.find(o => o.value === answer);
              const hasNote = notes[q.id];
              return (
                <div key={q.id} className="flex justify-between items-center">
                  <span className="text-gray-400 flex items-center gap-1">
                    {q.question.replace('¿', '').replace('?', '').substring(0, 30)}...
                    {hasNote && <MessageSquare size={12} className="text-nexus-accent" />}
                  </span>
                  <span className="text-white font-medium">{option?.label || '-'}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notes Summary (if any) */}
        {Object.keys(notes).length > 0 && (
          <div className="bg-nexus-base p-4 rounded-lg">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <MessageSquare size={18} className="text-nexus-accent" />
              Notas Agregadas ({Object.keys(notes).length})
            </h4>
            <div className="space-y-2 text-sm max-h-32 overflow-y-auto">
              {Object.entries(notes).map(([qId, note]) => {
                const question = QUALIFICATION_QUESTIONS.find(q => q.id === qId);
                return (
                  <div key={qId} className="text-gray-300 border-l-2 border-nexus-accent pl-2">
                    <span className="text-gray-500 text-xs">{question?.question.substring(0, 25)}...</span>
                    <p className="text-white">{note}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setShowResults(false)}
            className="flex-1 px-4 py-3 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
          >
            Revisar Respuestas
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 px-4 py-3 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle size={18} />
            Guardar Calificación
          </button>
        </div>
      </div>
    );
  }

  // Questionnaire view
  return (
    <div className="space-y-6">
      {/* Progress Bar with clickable indicators */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-400">
          <span>Pregunta {currentStep + 1} de {visibleQuestions.length}</span>
          <span>{answeredCount}/{visibleQuestions.length} respondidas ({Math.round(progress)}%)</span>
        </div>

        {/* Clickable progress indicators */}
        <div className="flex items-center gap-1">
          {visibleQuestions.map((q, index) => {
            const isAnswered = !!answers[q.id];
            const hasNote = !!notes[q.id];
            const isCurrent = index === currentStep;

            return (
              <button
                key={q.id}
                onClick={() => handleJumpToQuestion(index)}
                className={`flex-1 h-2 rounded-full transition-all relative group ${isCurrent
                    ? 'bg-nexus-accent'
                    : isAnswered
                      ? 'bg-green-500'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                title={`${q.question.substring(0, 30)}...`}
              >
                {hasNote && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-400 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Question */}
      <div className="py-4">
        <h3 className="text-xl font-bold text-white mb-6">
          {currentQuestion.question}
        </h3>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.value;
            return (
              <button
                key={option.value}
                onClick={() => handleSelectOption(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${isSelected
                    ? 'bg-nexus-accent/20 border-nexus-accent text-white'
                    : 'bg-nexus-base border-white/10 text-gray-300 hover:border-white/30'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-nexus-accent' : 'border-gray-500'
                    }`}>
                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-nexus-accent" />}
                  </div>
                  <span>{option.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Note Section (collapsible) */}
        <div className="mt-4">
          {expandedNote === currentQuestion.id ? (
            <div className="bg-nexus-base border border-white/10 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <MessageSquare size={14} />
                  Nota para esta pregunta
                </span>
                <button
                  onClick={() => setExpandedNote(null)}
                  className="text-gray-500 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
              <textarea
                value={currentNoteText}
                onChange={(e) => setCurrentNoteText(e.target.value)}
                placeholder="Ej: Cliente menciona que espera bono en enero para completar inicial..."
                className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white text-sm resize-none focus:border-nexus-accent focus:outline-none"
                rows={3}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setExpandedNote(null);
                    setCurrentNoteText('');
                  }}
                  className="px-3 py-1 text-sm text-gray-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleNoteSave}
                  className="px-3 py-1 text-sm bg-nexus-accent/20 text-nexus-accent rounded hover:bg-nexus-accent/30"
                >
                  Guardar Nota
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => handleNoteToggle(currentQuestion.id)}
              className={`text-sm flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${notes[currentQuestion.id]
                  ? 'text-nexus-accent bg-nexus-accent/10'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
            >
              <MessageSquare size={14} />
              {notes[currentQuestion.id] ? 'Ver/Editar nota' : 'Agregar nota'}
              {notes[currentQuestion.id] && (
                <span className="text-xs text-gray-400 max-w-[150px] truncate">
                  - {notes[currentQuestion.id]}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-4">
        {currentStep > 0 ? (
          <button
            onClick={handleBack}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
          >
            <ChevronLeft size={18} />
            Anterior
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!answers[currentQuestion.id]}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold transition-colors ${answers[currentQuestion.id]
              ? 'bg-nexus-accent text-nexus-base hover:bg-orange-400'
              : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
        >
          {isLastQuestion ? 'Ver Resultados' : 'Siguiente'}
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Save Draft Button */}
      {onSaveDraft && answeredCount > 0 && (
        <button
          onClick={handleSaveDraft}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-400 border border-dashed border-white/20 rounded-lg hover:bg-white/5 hover:text-white transition-colors"
        >
          <Save size={16} />
          Guardar Borrador ({answeredCount}/{visibleQuestions.length} respondidas)
        </button>
      )}

      {/* Current Score Preview */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          Score actual: <span className={`font-bold ${score.category === 'HOT' ? 'text-red-500' :
              score.category === 'WARM' ? 'text-yellow-500' : 'text-blue-500'
            }`}>{score.percentage}% ({score.category})</span>
        </p>
      </div>
    </div>
  );
};

export default LeadQualification;
