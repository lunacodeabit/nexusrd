// Sistema de Lead Scoring - Preguntas y Puntuaciones

export interface QualificationQuestion {
  id: string;
  question: string;
  options: QualificationOption[];
  conditional?: {
    dependsOn: string;
    showWhen: string[];
  };
}

export interface QualificationOption {
  value: string;
  label: string;
  points: number;
}

export interface QualificationAnswers {
  [questionId: string]: string;
}

export interface LeadScore {
  total: number;
  maxPossible: number;
  percentage: number;
  category: 'HOT' | 'WARM' | 'COLD';
  answers: QualificationAnswers;
}

// Definición de preguntas con puntuación
export const QUALIFICATION_QUESTIONS: QualificationQuestion[] = [
  {
    id: 'propertyType',
    question: '¿Qué tipo de propiedad te interesa?',
    options: [
      { value: 'apartment', label: 'Apartamento', points: 10 },
      { value: 'house', label: 'Casa', points: 10 },
      { value: 'penthouse', label: 'Penthouse', points: 12 },
      { value: 'land', label: 'Solar/Terreno', points: 8 },
      { value: 'commercial', label: 'Comercial', points: 10 },
      { value: 'undecided', label: 'No estoy seguro', points: 5 },
    ]
  },
  {
    id: 'investmentGoal',
    question: '¿Cuál es el objetivo principal de tu inversión?',
    options: [
      { value: 'living', label: 'Vivienda propia', points: 12 },
      { value: 'rental', label: 'Inversión para renta', points: 15 },
      { value: 'resale', label: 'Comprar para revender', points: 12 },
      { value: 'vacation', label: 'Segunda vivienda / Vacaciones', points: 10 },
      { value: 'exploring', label: 'Solo explorando opciones', points: 3 },
    ]
  },
  {
    id: 'bedrooms',
    question: '¿Cuántas habitaciones te interesan?',
    options: [
      { value: 'studio', label: 'Estudio', points: 8 },
      { value: '1', label: '1 habitación', points: 10 },
      { value: '2', label: '2 habitaciones', points: 12 },
      { value: '3', label: '3 habitaciones', points: 12 },
      { value: '4+', label: '4 o más habitaciones', points: 12 },
      { value: 'flexible', label: 'Flexible / No definido', points: 6 },
    ]
  },
  {
    id: 'firstInvestment',
    question: '¿Esta sería tu primera inversión inmobiliaria?',
    options: [
      { value: 'yes', label: 'Sí, es mi primera vez', points: 8 },
      { value: 'no', label: 'No, ya tengo experiencia', points: 15 },
      { value: 'sold', label: 'Vendí y busco reinvertir', points: 18 },
    ]
  },
  {
    id: 'rentalPreference',
    question: 'Si es para renta, ¿prefieres corto o largo plazo?',
    options: [
      { value: 'shortTerm', label: 'Corto plazo (Airbnb)', points: 12 },
      { value: 'longTerm', label: 'Largo plazo (contratos anuales)', points: 15 },
      { value: 'both', label: 'Ambas opciones', points: 12 },
      { value: 'notApplicable', label: 'No aplica / No es para renta', points: 10 },
    ],
    conditional: {
      dependsOn: 'investmentGoal',
      showWhen: ['rental', 'resale']
    }
  },
  {
    id: 'budget',
    question: '¿Cuál es tu presupuesto estimado para esta inversión?',
    options: [
      { value: 'under100k', label: 'Menos de $100,000', points: 8 },
      { value: '100k-200k', label: '$100,000 - $200,000', points: 12 },
      { value: '200k-350k', label: '$200,000 - $350,000', points: 15 },
      { value: '350k-500k', label: '$350,000 - $500,000', points: 18 },
      { value: 'over500k', label: 'Más de $500,000', points: 20 },
      { value: 'undefined', label: 'Aún no lo tengo definido', points: 5 },
    ]
  },
  {
    id: 'financing',
    question: '¿Tienes preaprobación bancaria o necesitas orientación?',
    options: [
      { value: 'approved', label: 'Sí, ya tengo preaprobación', points: 20 },
      { value: 'inProcess', label: 'Estoy en proceso de obtenerla', points: 15 },
      { value: 'needHelp', label: 'Necesito orientación financiera', points: 10 },
      { value: 'cash', label: 'Compraré al contado', points: 25 },
      { value: 'notStarted', label: 'No he iniciado el proceso', points: 5 },
    ]
  },
  {
    id: 'decisionMakers',
    question: '¿Hay otras personas involucradas en la toma de decisión?',
    options: [
      { value: 'alone', label: 'No, decido solo/a', points: 15 },
      { value: 'spouse', label: 'Sí, mi pareja/cónyuge', points: 12 },
      { value: 'family', label: 'Sí, otros familiares', points: 8 },
      { value: 'partner', label: 'Sí, socio(s) de inversión', points: 10 },
    ]
  },
  {
    id: 'needToSell',
    question: '¿Necesitas vender otra propiedad para poder comprar esta?',
    options: [
      { value: 'no', label: 'No, tengo capital disponible', points: 20 },
      { value: 'yes', label: 'Sí, necesito vender primero', points: 8 },
      { value: 'inProcess', label: 'Ya está en proceso de venta', points: 15 },
      { value: 'notApplicable', label: 'No aplica', points: 12 },
    ]
  },
  {
    id: 'scheduleAppointment',
    question: '¿Te gustaría agendar una cita para discutir opciones?',
    options: [
      { value: 'virtual', label: 'Sí, cita virtual', points: 18 },
      { value: 'inPerson', label: 'Sí, cita presencial', points: 20 },
      { value: 'later', label: 'Más adelante', points: 8 },
      { value: 'no', label: 'No por ahora', points: 3 },
    ]
  }
];

// Calcular puntuación total
export function calculateLeadScore(answers: QualificationAnswers): LeadScore {
  let total = 0;
  let maxPossible = 0;

  QUALIFICATION_QUESTIONS.forEach(question => {
    // Calcular máximo posible
    const maxPoints = Math.max(...question.options.map(o => o.points));
    
    // Verificar si la pregunta aplica (condicional)
    if (question.conditional) {
      const dependsOnAnswer = answers[question.conditional.dependsOn];
      if (!question.conditional.showWhen.includes(dependsOnAnswer)) {
        return; // No contar esta pregunta
      }
    }
    
    maxPossible += maxPoints;

    // Sumar puntos de la respuesta
    const answer = answers[question.id];
    if (answer) {
      const option = question.options.find(o => o.value === answer);
      if (option) {
        total += option.points;
      }
    }
  });

  const percentage = maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
  
  let category: 'HOT' | 'WARM' | 'COLD';
  if (percentage >= 75) {
    category = 'HOT';
  } else if (percentage >= 50) {
    category = 'WARM';
  } else {
    category = 'COLD';
  }

  return {
    total,
    maxPossible,
    percentage,
    category,
    answers
  };
}

// Obtener color según categoría
export function getScoreColor(category: 'HOT' | 'WARM' | 'COLD'): string {
  switch (category) {
    case 'HOT': return 'text-red-500 bg-red-500/20 border-red-500/30';
    case 'WARM': return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
    case 'COLD': return 'text-blue-500 bg-blue-500/20 border-blue-500/30';
  }
}

export function getScoreEmoji(category: 'HOT' | 'WARM' | 'COLD'): string {
  switch (category) {
    case 'HOT': return '🔥';
    case 'WARM': return '🟡';
    case 'COLD': return '🔵';
  }
}
