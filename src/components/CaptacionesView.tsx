import React, { useState, useRef } from 'react';
import { 
  Link2, Plus, ExternalLink, Search, Trash2, Edit3, 
  MapPin, Building2, Phone, Mail, Sparkles, X, Check,
  Instagram, Youtube, Globe, MessageCircle, ChevronDown, Filter,
  Image, Upload, Camera
} from 'lucide-react';
import type { Captacion, SocialPlatform, ProjectType, CaptacionStatus } from '../types/captaciones';
import { detectPlatform, getPlatformInfo, getStatusInfo, getProjectTypeLabel } from '../types/captaciones';
import { useCaptaciones } from '../hooks/useCaptaciones';
import Modal from './Modal';

const CaptacionesView: React.FC = () => {
  const { captaciones, addCaptacion, updateCaptacion, deleteCaptacion, searchWithAI, loading } = useCaptaciones();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCaptacion, setSelectedCaptacion] = useState<Captacion | null>(null);
  const [filterStatus, setFilterStatus] = useState<CaptacionStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [quickUrl, setQuickUrl] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    url: '',
    platform: 'instagram' as SocialPlatform,
    projectName: '',
    developerName: '',
    developerPhone: '',
    location: '',
    projectType: 'proyecto_nuevo' as ProjectType,
    notes: ''
  });

  // Handle screenshot upload
  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlChange = (url: string) => {
    const platform = detectPlatform(url);
    setFormData({ ...formData, url, platform });
  };

  // Quick save - guardar enlace rápido sin abrir modal
  const handleQuickSave = () => {
    if (!quickUrl.trim()) return;
    
    const platform = detectPlatform(quickUrl);
    addCaptacion({
      url: quickUrl,
      platform,
      status: 'pendiente',
      projectType: 'proyecto_nuevo'
    });
    setQuickUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.url) return;

    addCaptacion({
      url: formData.url,
      platform: formData.platform,
      projectName: formData.projectName || undefined,
      developerName: formData.developerName || undefined,
      developerPhone: formData.developerPhone || undefined,
      location: formData.location || undefined,
      projectType: formData.projectType,
      notes: formData.notes || undefined,
      status: 'pendiente'
    });

    // Reset form
    setFormData({
      url: '',
      platform: 'instagram',
      projectName: '',
      developerName: '',
      developerPhone: '',
      location: '',
      projectType: 'proyecto_nuevo',
      notes: ''
    });
    setIsFormOpen(false);
  };

  const handleAISearch = async (captacion: Captacion, type: 'google' | 'maps' | 'linkedin' | 'perplexity' = 'google') => {
    const searchUrls = await searchWithAI(captacion);
    window.open(searchUrls[type], '_blank');
    
    // Marcar que se hizo búsqueda
    updateCaptacion(captacion.id, {
      aiSearchResult: {
        searchedAt: new Date().toISOString(),
        foundInfo: `Búsqueda ${type} iniciada`,
        confidence: type === 'perplexity' ? 'high' : 'medium'
      }
    });
  };

  const handleStatusChange = (id: string, status: CaptacionStatus) => {
    updateCaptacion(id, { status });
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar esta captación?')) {
      deleteCaptacion(id);
      setSelectedCaptacion(null);
    }
  };

  // Filter captaciones
  const filteredCaptaciones = captaciones.filter(cap => {
    const matchesStatus = filterStatus === 'all' || cap.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      cap.projectName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.developerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.url.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getPlatformIcon = (platform: SocialPlatform) => {
    switch (platform) {
      case 'instagram': return <Instagram size={16} />;
      case 'youtube': return <Youtube size={16} />;
      case 'tiktok': return <MessageCircle size={16} />;
      default: return <Globe size={16} />;
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'contactado', label: 'Contactado' },
    { value: 'en_negociacion', label: 'Negociación' },
    { value: 'captado', label: '✓ Captado' },
    { value: 'descartado', label: 'Descartado' }
  ] as const;

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <Link2 className="text-nexus-accent" size={20} />
          Captaciones
        </h2>
        <p className="text-gray-400 text-xs md:text-sm mt-1">
          Guarda enlaces de propiedades que te interesa captar
        </p>
      </div>

      {/* Quick Add - Con campo para descripción y captura */}
      <div className="bg-gradient-to-r from-nexus-accent/20 to-orange-600/10 p-4 rounded-lg border border-nexus-accent/30 space-y-3">
        <div>
          <p className="text-xs text-gray-400 mb-2">🔗 <strong>Paso 1:</strong> Pega el enlace del post:</p>
          <input 
            type="url"
            placeholder="https://www.instagram.com/p/..."
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            className="w-full bg-nexus-base border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-nexus-accent text-white placeholder-gray-500"
          />
        </div>
        
        <div>
          <p className="text-xs text-gray-400 mb-2">📝 <strong>Paso 2:</strong> Copia y pega la descripción del post:</p>
          <textarea
            placeholder="Pega aquí el texto/descripción del post de Instagram, Facebook, etc..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            className="w-full bg-nexus-base border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-nexus-accent text-white placeholder-gray-500 resize-none"
          />
        </div>

        {/* Screenshot upload */}
        <div>
          <p className="text-xs text-gray-400 mb-2">📸 <strong>Paso 3 (opcional):</strong> Sube captura de pantalla del post:</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleScreenshotUpload}
            className="hidden"
          />
          
          {screenshotPreview ? (
            <div className="relative">
              <img 
                src={screenshotPreview} 
                alt="Captura del post" 
                className="w-full max-h-40 object-cover rounded-lg border border-white/20"
              />
              <button
                onClick={() => {
                  setScreenshotPreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-nexus-base border border-dashed border-white/30 rounded-lg text-gray-400 hover:border-nexus-accent hover:text-nexus-accent transition-colors"
            >
              <Camera size={18} />
              <span className="text-sm">Subir captura de pantalla</span>
            </button>
          )}
          <p className="text-[10px] text-gray-500 mt-1">La IA analizará la imagen para extraer información</p>
        </div>

        <button 
          onClick={() => {
            if (!quickUrl.trim()) return;
            const platform = detectPlatform(quickUrl);
            addCaptacion({
              url: quickUrl,
              platform,
              postDescription: formData.notes || undefined,
              screenshotBase64: screenshotPreview || undefined,
              status: 'pendiente',
              projectType: 'proyecto_nuevo'
            });
            setQuickUrl('');
            setFormData({ ...formData, notes: '' });
            setScreenshotPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          disabled={!quickUrl.trim()}
          className="w-full bg-nexus-accent text-nexus-base font-bold px-6 py-3 rounded-lg hover:bg-orange-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Guardar Captación
        </button>
        
        <p className="text-[10px] text-gray-500 text-center">
          💡 La IA usará la descripción y/o captura para buscar información de contacto de la constructora
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-nexus-surface p-3 md:p-4 rounded-lg border border-white/5 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-gray-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar captación..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-nexus-base border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-nexus-accent text-white"
          />
        </div>

        {/* Mobile: Dropdown filter */}
        <div className="md:hidden">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-nexus-base border border-white/10 rounded-lg text-sm"
          >
            <span className="flex items-center gap-2 text-gray-300">
              <Filter size={16} />
              {statusOptions.find(s => s.value === filterStatus)?.label || 'Filtrar'}
            </span>
            <ChevronDown size={16} className={`text-gray-400 transition-transform ${showMobileFilters ? 'rotate-180' : ''}`} />
          </button>
          
          {showMobileFilters && (
            <div className="mt-2 grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setFilterStatus(status.value);
                    setShowMobileFilters(false);
                  }}
                  className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all ${
                    filterStatus === status.value 
                      ? 'bg-nexus-accent text-nexus-base border-nexus-accent' 
                      : 'bg-nexus-base text-gray-400 border-white/10 hover:border-white/30'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop: Horizontal filters */}
        <div className="hidden md:flex gap-2 flex-wrap">
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilterStatus(status.value)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap border transition-all ${
                filterStatus === status.value 
                  ? 'bg-nexus-accent text-nexus-base border-nexus-accent' 
                  : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30'
              }`}
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500">
        Mostrando {filteredCaptaciones.length} de {captaciones.length} captaciones
      </p>

      {/* Captaciones Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredCaptaciones.map((captacion) => {
          const platformInfo = getPlatformInfo(captacion.platform);
          const statusInfo = getStatusInfo(captacion.status);
          
          return (
            <div 
              key={captacion.id}
              className="bg-nexus-surface rounded-lg border border-white/5 hover:border-nexus-accent/50 transition-all overflow-hidden cursor-pointer group"
              onClick={() => setSelectedCaptacion(captacion)}
            >
              {/* Platform Header */}
              <div className={`${platformInfo.color} px-4 py-2 flex items-center justify-between`}>
                <div className="flex items-center gap-2 text-white text-sm font-medium">
                  {getPlatformIcon(captacion.platform)}
                  {platformInfo.name}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                {/* Project Name */}
                <h3 className="font-bold text-white text-lg truncate">
                  {captacion.projectName || 'Sin nombre'}
                </h3>

                {/* Developer */}
                {captacion.developerName && (
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <Building2 size={14} className="text-nexus-accent" />
                    {captacion.developerName}
                  </p>
                )}

                {/* Location */}
                {captacion.location && (
                  <p className="text-sm text-gray-400 flex items-center gap-2">
                    <MapPin size={14} className="text-nexus-accent" />
                    {captacion.location}
                  </p>
                )}

                {/* Data indicators */}
                <div className="flex gap-2 flex-wrap">
                  {captacion.postDescription && (
                    <span className="text-[10px] text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-0.5 rounded">
                      ✓ Descripción
                    </span>
                  )}
                  {captacion.screenshotBase64 && (
                    <span className="text-[10px] text-blue-400 flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded">
                      <Image size={10} /> Captura
                    </span>
                  )}
                </div>

                {/* URL Preview */}
                <p className="text-xs text-gray-500 truncate">
                  {captacion.url}
                </p>

                {/* Actions - Búsqueda IA */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <p className="text-[10px] text-gray-500">🔍 Buscar constructora:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(captacion.url, '_blank'); }}
                      className="flex items-center justify-center gap-1 py-2 bg-white/5 text-gray-300 rounded hover:bg-white/10 transition-colors text-xs"
                    >
                      <ExternalLink size={12} />
                      Ver Post
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAISearch(captacion, 'perplexity'); }}
                      className="flex items-center justify-center gap-1 py-2 bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-300 rounded hover:from-purple-600/50 hover:to-blue-600/50 transition-colors text-xs font-medium"
                      disabled={loading}
                      title="Búsqueda profunda con Perplexity AI"
                    >
                      <Sparkles size={12} />
                      Perplexity AI
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAISearch(captacion, 'google'); }}
                      className="flex items-center justify-center gap-1 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-xs"
                      disabled={loading}
                    >
                      <Search size={12} />
                      Google
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAISearch(captacion, 'maps'); }}
                      className="flex items-center justify-center gap-1 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-xs"
                      disabled={loading}
                    >
                      <MapPin size={12} />
                      Maps
                    </button>
                  </div>
                </div>

                {/* AI Search indicator */}
                {captacion.aiSearchResult && (
                  <p className="text-[10px] text-purple-400 flex items-center gap-1">
                    <Sparkles size={10} />
                    Buscado: {new Date(captacion.aiSearchResult.searchedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {captaciones.length === 0 && (
        <div className="text-center py-12">
          <Link2 size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-500 mb-2">No tienes captaciones guardadas</p>
          <p className="text-gray-600 text-sm mb-4">
            Guarda enlaces de Instagram, Facebook, TikTok o YouTube de propiedades que te interesen
          </p>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="text-nexus-accent hover:underline"
          >
            Guardar primer enlace
          </button>
        </div>
      )}

      {/* Modal: New Captacion Form */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Guardar Enlace de Captación">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* URL Input - Most important */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Enlace del Post/Video *
            </label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-nexus-accent"
            />
            {formData.url && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                Plataforma detectada: 
                <span className={`px-2 py-0.5 rounded ${getPlatformInfo(formData.platform).color} text-white`}>
                  {getPlatformInfo(formData.platform).name}
                </span>
              </p>
            )}
          </div>

          {/* Project Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nombre del Proyecto</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                placeholder="Ej: Torre Mirador"
                className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo</label>
              <select
                value={formData.projectType}
                onChange={(e) => setFormData({ ...formData, projectType: e.target.value as ProjectType })}
                className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
              >
                <option value="proyecto_nuevo">Proyecto Nuevo</option>
                <option value="apartamento">Apartamento</option>
                <option value="casa">Casa</option>
                <option value="villa">Villa</option>
                <option value="penthouse">Penthouse</option>
                <option value="local_comercial">Local Comercial</option>
                <option value="terreno">Terreno</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Developer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Constructora/Desarrollador</label>
              <input
                type="text"
                value={formData.developerName}
                onChange={(e) => setFormData({ ...formData, developerName: e.target.value })}
                placeholder="Si lo conoces..."
                className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Teléfono (si disponible)</label>
              <input
                type="tel"
                value={formData.developerPhone}
                onChange={(e) => setFormData({ ...formData, developerPhone: e.target.value })}
                placeholder="809-555-1234"
                className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Ubicación</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ej: Punta Cana, Santiago, Santo Domingo..."
              className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="¿Por qué te interesa? ¿Qué información viste?"
              rows={2}
              className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Captacion Detail */}
      <Modal 
        isOpen={!!selectedCaptacion} 
        onClose={() => setSelectedCaptacion(null)} 
        title="Detalle de Captación"
      >
        {selectedCaptacion && (
          <CaptacionDetail 
            captacion={selectedCaptacion}
            onUpdate={(updates) => updateCaptacion(selectedCaptacion.id, updates)}
            onDelete={() => handleDelete(selectedCaptacion.id)}
            onAISearch={(type: 'google' | 'maps' | 'linkedin' | 'perplexity') => handleAISearch(selectedCaptacion, type)}
            onClose={() => setSelectedCaptacion(null)}
          />
        )}
      </Modal>
    </div>
  );
};

// Detail Component
interface CaptacionDetailProps {
  captacion: Captacion;
  onUpdate: (updates: Partial<Captacion>) => void;
  onDelete: () => void;
  onAISearch: (type: 'google' | 'maps' | 'linkedin' | 'perplexity') => void;
  onClose: () => void;
}

const CaptacionDetail: React.FC<CaptacionDetailProps> = ({ 
  captacion, onUpdate, onDelete, onAISearch, onClose 
}) => {
  const [editing, setEditing] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [editingScreenshot, setEditingScreenshot] = useState(false);
  const [newScreenshot, setNewScreenshot] = useState<string | null>(null);
  const screenshotInputRef = useRef<HTMLInputElement>(null);
  const [editData, setEditData] = useState({
    projectName: captacion.projectName || '',
    developerName: captacion.developerName || '',
    developerPhone: captacion.developerPhone || '',
    developerEmail: captacion.developerEmail || '',
    location: captacion.location || '',
    notes: captacion.notes || '',
    postDescription: captacion.postDescription || ''
  });

  const platformInfo = getPlatformInfo(captacion.platform);
  const statusInfo = getStatusInfo(captacion.status);

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen debe ser menor a 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewScreenshot(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    onUpdate({
      projectName: editData.projectName || undefined,
      developerName: editData.developerName || undefined,
      developerPhone: editData.developerPhone || undefined,
      developerEmail: editData.developerEmail || undefined,
      location: editData.location || undefined,
      notes: editData.notes || undefined
    });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      {/* Platform Header */}
      <div className={`${platformInfo.color} -mx-6 -mt-2 px-6 py-3 flex items-center justify-between`}>
        <span className="text-white font-medium">{platformInfo.name}</span>
        <button
          onClick={() => window.open(captacion.url, '_blank')}
          className="flex items-center gap-1 text-white/80 hover:text-white text-sm"
        >
          <ExternalLink size={14} />
          Abrir
        </button>
      </div>

      {/* Status Selector */}
      <div>
        <label className="text-xs text-gray-500 block mb-2">Estado</label>
        <div className="flex gap-2 flex-wrap">
          {(['pendiente', 'contactado', 'en_negociacion', 'captado', 'descartado'] as CaptacionStatus[]).map((status) => {
            const info = getStatusInfo(status);
            return (
              <button
                key={status}
                onClick={() => onUpdate({ status })}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${
                  captacion.status === status ? info.color : 'bg-transparent text-gray-400 border-white/10'
                }`}
              >
                {info.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Editable Fields */}
      {editing ? (
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500">Nombre del Proyecto</label>
            <input
              type="text"
              value={editData.projectName}
              onChange={(e) => setEditData({ ...editData, projectName: e.target.value })}
              className="w-full bg-nexus-base border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-nexus-accent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Constructora/Desarrollador</label>
            <input
              type="text"
              value={editData.developerName}
              onChange={(e) => setEditData({ ...editData, developerName: e.target.value })}
              className="w-full bg-nexus-base border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-nexus-accent"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Teléfono</label>
              <input
                type="tel"
                value={editData.developerPhone}
                onChange={(e) => setEditData({ ...editData, developerPhone: e.target.value })}
                className="w-full bg-nexus-base border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Email</label>
              <input
                type="email"
                value={editData.developerEmail}
                onChange={(e) => setEditData({ ...editData, developerEmail: e.target.value })}
                className="w-full bg-nexus-base border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-nexus-accent"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Ubicación</label>
            <input
              type="text"
              value={editData.location}
              onChange={(e) => setEditData({ ...editData, location: e.target.value })}
              className="w-full bg-nexus-base border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-nexus-accent"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Notas</label>
            <textarea
              value={editData.notes}
              onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
              rows={2}
              className="w-full bg-nexus-base border border-white/10 rounded px-3 py-2 text-white focus:outline-none focus:border-nexus-accent resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
            >
              <Check size={16} /> Guardar
            </button>
            <button
              onClick={() => setEditing(false)}
              className="flex-1 flex items-center justify-center gap-1 py-2 bg-white/5 text-gray-400 rounded hover:bg-white/10"
            >
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">
              {captacion.projectName || 'Sin nombre'}
            </h3>
            <button
              onClick={() => setEditing(true)}
              className="text-gray-400 hover:text-nexus-accent"
            >
              <Edit3 size={16} />
            </button>
          </div>

          {captacion.developerName && (
            <div className="flex items-center gap-2 text-gray-300">
              <Building2 size={16} className="text-nexus-accent" />
              {captacion.developerName}
            </div>
          )}

          {captacion.location && (
            <div className="flex items-center gap-2 text-gray-300">
              <MapPin size={16} className="text-nexus-accent" />
              {captacion.location}
            </div>
          )}

          {captacion.developerPhone && (
            <div className="flex items-center gap-2 text-gray-300">
              <Phone size={16} className="text-green-400" />
              <a href={`tel:${captacion.developerPhone}`} className="hover:text-green-400">
                {captacion.developerPhone}
              </a>
            </div>
          )}

          {captacion.developerEmail && (
            <div className="flex items-center gap-2 text-gray-300">
              <Mail size={16} className="text-blue-400" />
              <a href={`mailto:${captacion.developerEmail}`} className="hover:text-blue-400">
                {captacion.developerEmail}
              </a>
            </div>
          )}

          {captacion.notes && (
            <div className="bg-nexus-base p-3 rounded-lg">
              <p className="text-xs text-gray-500 mb-1">Notas</p>
              <p className="text-gray-300 text-sm">{captacion.notes}</p>
            </div>
          )}

          <p className="text-xs text-gray-500">
            Guardado: {new Date(captacion.createdAt).toLocaleDateString('es-ES')}
          </p>
        </div>
      )}

      {/* Post Description - Para búsqueda IA */}
      <div className="bg-nexus-base p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">📝 Descripción del post (para búsqueda IA)</p>
          <button
            onClick={() => setEditingDescription(!editingDescription)}
            className="text-xs text-nexus-accent hover:underline"
          >
            {editingDescription ? 'Cancelar' : (captacion.postDescription ? 'Editar' : '+ Agregar')}
          </button>
        </div>
        
        {editingDescription ? (
          <div className="space-y-2">
            <textarea
              value={editData.postDescription}
              onChange={(e) => setEditData({ ...editData, postDescription: e.target.value })}
              placeholder="Pega aquí la descripción/texto del post de Instagram, Facebook, etc. La IA usará esta información para buscar la constructora."
              rows={4}
              className="w-full bg-nexus-surface border border-white/10 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-nexus-accent resize-none"
            />
            <button
              onClick={() => {
                onUpdate({ postDescription: editData.postDescription || undefined });
                setEditingDescription(false);
              }}
              className="w-full py-2 bg-nexus-accent text-nexus-base font-medium rounded text-sm"
            >
              Guardar descripción
            </button>
          </div>
        ) : (
          captacion.postDescription ? (
            <p className="text-gray-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
              {captacion.postDescription}
            </p>
          ) : (
            <p className="text-gray-500 text-sm italic">
              Sin descripción. Agrega el texto del post para mejorar la búsqueda IA.
            </p>
          )
        )}
      </div>

      {/* Screenshot - Para búsqueda IA con visión */}
      <div className="bg-nexus-base p-3 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-gray-500">📸 Captura de pantalla del post</p>
          <button
            onClick={() => {
              setEditingScreenshot(!editingScreenshot);
              setNewScreenshot(null);
            }}
            className="text-xs text-nexus-accent hover:underline"
          >
            {editingScreenshot ? 'Cancelar' : (captacion.screenshotBase64 ? 'Cambiar' : '+ Agregar')}
          </button>
        </div>
        
        <input
          ref={screenshotInputRef}
          type="file"
          accept="image/*"
          onChange={handleScreenshotChange}
          className="hidden"
        />
        
        {editingScreenshot ? (
          <div className="space-y-2">
            {newScreenshot ? (
              <div className="relative">
                <img 
                  src={newScreenshot} 
                  alt="Nueva captura" 
                  className="w-full max-h-48 object-contain rounded-lg border border-white/20"
                />
                <button
                  onClick={() => {
                    setNewScreenshot(null);
                    if (screenshotInputRef.current) screenshotInputRef.current.value = '';
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => screenshotInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-4 bg-nexus-surface border border-dashed border-white/30 rounded-lg text-gray-400 hover:border-nexus-accent hover:text-nexus-accent transition-colors"
              >
                <Upload size={18} />
                <span className="text-sm">Seleccionar imagen</span>
              </button>
            )}
            {newScreenshot && (
              <button
                onClick={() => {
                  onUpdate({ screenshotBase64: newScreenshot });
                  setEditingScreenshot(false);
                  setNewScreenshot(null);
                }}
                className="w-full py-2 bg-nexus-accent text-nexus-base font-medium rounded text-sm"
              >
                Guardar captura
              </button>
            )}
          </div>
        ) : (
          captacion.screenshotBase64 ? (
            <img 
              src={captacion.screenshotBase64} 
              alt="Captura del post" 
              className="w-full max-h-48 object-contain rounded-lg border border-white/20 cursor-pointer hover:opacity-80"
              onClick={() => window.open(captacion.screenshotBase64, '_blank')}
            />
          ) : (
            <p className="text-gray-500 text-sm italic">
              Sin captura. Agrega una imagen del post para análisis con IA.
            </p>
          )
        )}
      </div>

      {/* AI Search Buttons */}
      <div className="space-y-3">
        <p className="text-xs text-gray-500 text-center">🔍 Buscar contacto de constructora en RD:</p>
        
        {/* Perplexity - Principal */}
        <button
          onClick={() => onAISearch('perplexity')}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          <Sparkles size={18} />
          Búsqueda Profunda con Perplexity AI
        </button>
        
        {/* Otros buscadores */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onAISearch('google')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-blue-500/20 text-blue-400 font-medium rounded-lg hover:bg-blue-500/30 transition-colors"
          >
            <Search size={16} />
            <span className="text-[10px]">Google</span>
          </button>
          <button
            onClick={() => onAISearch('maps')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-green-500/20 text-green-400 font-medium rounded-lg hover:bg-green-500/30 transition-colors"
          >
            <MapPin size={16} />
            <span className="text-[10px]">Maps</span>
          </button>
          <button
            onClick={() => onAISearch('linkedin')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 bg-sky-500/20 text-sky-400 font-medium rounded-lg hover:bg-sky-500/30 transition-colors"
          >
            <Building2 size={16} />
            <span className="text-[10px]">LinkedIn</span>
          </button>
        </div>
        
        {!captacion.postDescription && (
          <p className="text-[10px] text-yellow-500/80 text-center">
            💡 Tip: Agrega la descripción del post arriba para mejores resultados
          </p>
        )}
      </div>

      {captacion.aiSearchResult && (
        <p className="text-xs text-purple-400 text-center">
          Última búsqueda: {new Date(captacion.aiSearchResult.searchedAt).toLocaleString('es-ES')}
        </p>
      )}

      {/* URL */}
      <div className="bg-nexus-base p-3 rounded-lg">
        <p className="text-xs text-gray-500 mb-1">Enlace original</p>
        <a 
          href={captacion.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-400 text-sm hover:underline break-all"
        >
          {captacion.url}
        </a>
      </div>

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="w-full flex items-center justify-center gap-2 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
      >
        <Trash2 size={16} />
        Eliminar Captación
      </button>
    </div>
  );
};

export default CaptacionesView;
