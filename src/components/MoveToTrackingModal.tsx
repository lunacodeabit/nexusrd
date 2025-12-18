import React, { useState } from 'react';
import { X, Clock, Pause, Search, Calendar, MapPin, Home, DollarSign, Plus, Minus } from 'lucide-react';
import type { Lead, TrackingType, TrackingFormData, SearchCriteria } from '../types';
import { useFollowUpTracking } from '../hooks/useFollowUpTracking';

interface MoveToTrackingModalProps {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const trackingTypes = [
  {
    id: 'waiting' as TrackingType,
    label: 'En Espera',
    icon: Clock,
    color: 'amber',
    description: 'Esperando aprobación del banco, documentos, etc.',
    examples: ['Esperando aprobación de banco', 'Esperando documentos del vendedor', 'Esperando respuesta de otro comprador']
  },
  {
    id: 'paused' as TrackingType,
    label: 'Pausar Búsqueda',
    icon: Pause,
    color: 'blue',
    description: 'El cliente pausó su búsqueda temporalmente',
    examples: ['Viaja por trabajo', 'Problemas personales', 'Esperando vender su propiedad actual', 'No tiene prisa']
  },
  {
    id: 'searching' as TrackingType,
    label: 'Crear Búsqueda',
    icon: Search,
    color: 'purple',
    description: 'El cliente busca una propiedad con criterios específicos',
    examples: ['Apartamento 2-3 hab en Piantini', 'Casa con patio en Arroyo Hondo', 'Solar en Punta Cana']
  }
];

const MoveToTrackingModal: React.FC<MoveToTrackingModalProps> = ({
  lead,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { addTracking } = useFollowUpTracking();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<TrackingType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [contactDate, setContactDate] = useState('');
  
  // Search criteria (only for searching type)
  const [zones, setZones] = useState<string[]>(['']);
  const [bedroomsMin, setBedroomsMin] = useState<number | ''>('');
  const [bedroomsMax, setBedroomsMax] = useState<number | ''>('');
  const [budgetMin, setBudgetMin] = useState<number | ''>(lead.budget * 0.8);
  const [budgetMax, setBudgetMax] = useState<number | ''>(lead.budget * 1.2);
  const [propertyType, setPropertyType] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  const handleTypeSelect = (type: TrackingType) => {
    setSelectedType(type);
    setStep(2);
    // Pre-fill reason based on type
    if (type === 'searching') {
      setReason(lead.interestArea ? `Busca propiedad en ${lead.interestArea}` : 'Busca propiedad específica');
    }
  };

  const handleAddZone = () => {
    setZones([...zones, '']);
  };

  const handleRemoveZone = (index: number) => {
    setZones(zones.filter((_, i) => i !== index));
  };

  const handleZoneChange = (index: number, value: string) => {
    const newZones = [...zones];
    newZones[index] = value;
    setZones(newZones);
  };

  const toggleFeature = (feature: string) => {
    setFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = async () => {
    if (!selectedType || !reason.trim()) return;

    setIsSubmitting(true);
    try {
      const formData: TrackingFormData = {
        tracking_type: selectedType,
        reason: reason.trim(),
        notes: notes.trim() || undefined,
        contact_date: contactDate || undefined,
      };

      // Add search criteria for searching type
      if (selectedType === 'searching') {
        const searchCriteria: SearchCriteria = {
          zones: zones.filter(z => z.trim()),
          bedroomsMin: bedroomsMin || undefined,
          bedroomsMax: bedroomsMax || undefined,
          budgetMin: budgetMin || undefined,
          budgetMax: budgetMax || undefined,
          propertyType: propertyType || undefined,
          features: features.length > 0 ? features : undefined,
        };
        formData.search_criteria = searchCriteria;
      }

      await addTracking(lead.id, formData);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error moving lead to tracking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      amber: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400' },
      blue: { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' },
      purple: { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400' },
    };
    return isSelected ? colors[color] : { bg: 'bg-slate-800', border: 'border-slate-700', text: 'text-slate-400' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div>
            <h2 className="text-lg font-bold text-white">
              {step === 1 ? 'Mover a Seguimiento' : trackingTypes.find(t => t.id === selectedType)?.label}
            </h2>
            <p className="text-sm text-slate-400">{lead.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {/* Step 1: Select Type */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-slate-300 text-sm mb-4">¿Qué tipo de seguimiento quieres crear?</p>
              
              {trackingTypes.map(type => {
                const colors = getColorClasses(type.color, false);
                return (
                  <button
                    key={type.id}
                    onClick={() => handleTypeSelect(type.id)}
                    className={`w-full p-4 rounded-xl border ${colors.border} ${colors.bg} hover:bg-opacity-30 transition-all text-left group`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${colors.bg}`}>
                        <type.icon className={`w-5 h-5 ${colors.text}`} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors">
                          {type.label}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">{type.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {type.examples.slice(0, 2).map((ex, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-slate-800 text-slate-500 rounded">
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Form */}
          {step === 2 && selectedType && (
            <div className="space-y-4">
              {/* Back button */}
              <button
                onClick={() => setStep(1)}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                ← Cambiar tipo
              </button>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  {selectedType === 'waiting' && '🏦 ¿Qué estás esperando?'}
                  {selectedType === 'paused' && '⏸️ ¿Por qué pausa la búsqueda?'}
                  {selectedType === 'searching' && '🔍 ¿Qué busca el cliente?'}
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={trackingTypes.find(t => t.id === selectedType)?.examples[0]}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Contact Date */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  {selectedType === 'waiting' ? 'Fecha estimada' : 'Fecha para contactar'}
                </label>
                <input
                  type="date"
                  value={contactDate}
                  onChange={(e) => setContactDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Search Criteria (only for searching) */}
              {selectedType === 'searching' && (
                <div className="space-y-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <h4 className="font-medium text-purple-300 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    Criterios de Búsqueda
                  </h4>

                  {/* Zones */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Zonas de interés
                    </label>
                    {zones.map((zone, index) => (
                      <div key={index} className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={zone}
                          onChange={(e) => handleZoneChange(index, e.target.value)}
                          placeholder="Ej: Piantini, Naco"
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        {zones.length > 1 && (
                          <button
                            onClick={() => handleRemoveZone(index)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={handleAddZone}
                      className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Agregar zona
                    </button>
                  </div>

                  {/* Bedrooms */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        <Home className="w-4 h-4 inline mr-1" />
                        Hab. mín.
                      </label>
                      <input
                        type="number"
                        value={bedroomsMin}
                        onChange={(e) => setBedroomsMin(e.target.value ? Number(e.target.value) : '')}
                        min="0"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Hab. máx.</label>
                      <input
                        type="number"
                        value={bedroomsMax}
                        onChange={(e) => setBedroomsMax(e.target.value ? Number(e.target.value) : '')}
                        min="0"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Budget */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        Presupuesto mín.
                      </label>
                      <input
                        type="number"
                        value={budgetMin}
                        onChange={(e) => setBudgetMin(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-300 mb-1">Presupuesto máx.</label>
                      <input
                        type="number"
                        value={budgetMax}
                        onChange={(e) => setBudgetMax(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Property Type */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-1">Tipo de propiedad</label>
                    <select
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Cualquiera</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Penthouse">Penthouse</option>
                      <option value="Solar">Solar/Terreno</option>
                      <option value="Local">Local Comercial</option>
                      <option value="Villa">Villa</option>
                    </select>
                  </div>

                  {/* Features */}
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Características</label>
                    <div className="flex flex-wrap gap-2">
                      {['Terraza', 'Piscina', 'Parqueo', 'Seguridad 24/7', 'Gimnasio', 'Vista al mar', 'Amueblado', 'Planta eléctrica'].map(feature => (
                        <button
                          key={feature}
                          onClick={() => toggleFeature(feature)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            features.includes(feature)
                              ? 'bg-purple-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {feature}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  📝 Notas adicionales (opcional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Cualquier detalle adicional..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={onClose}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!reason.trim() || isSubmitting}
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoveToTrackingModal;
