// Captaciones de Interés - Enlaces de propiedades/proyectos para captar

export type SocialPlatform = 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'twitter' | 'linkedin' | 'website' | 'other';

export type ProjectType = 'apartamento' | 'casa' | 'villa' | 'penthouse' | 'local_comercial' | 'terreno' | 'proyecto_nuevo' | 'otro';

export type CaptacionStatus = 'pendiente' | 'contactado' | 'en_negociacion' | 'captado' | 'descartado';

export interface Captacion {
  id: string;
  // Información del enlace
  url: string;
  platform: SocialPlatform;
  thumbnailUrl?: string;
  
  // Descripción copiada del post (para que la IA analice)
  postDescription?: string;
  
  // Captura de pantalla del post (base64)
  screenshotBase64?: string;
  
  // Información del proyecto/propiedad
  projectName?: string;
  developerName?: string; // Constructora/Desarrollador
  developerPhone?: string;
  developerEmail?: string;
  location?: string;
  projectType?: ProjectType;
  
  // Notas y estado
  notes?: string;
  status: CaptacionStatus;
  
  // Resultados de búsqueda IA
  aiSearchResult?: {
    searchedAt: string;
    foundInfo: string;
    confidence: 'high' | 'medium' | 'low';
  };
  
  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

// Helper para detectar plataforma desde URL
export const detectPlatform = (url: string): SocialPlatform => {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('instagram.com') || lowercaseUrl.includes('instagr.am')) return 'instagram';
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.com') || lowercaseUrl.includes('fb.watch')) return 'facebook';
  if (lowercaseUrl.includes('tiktok.com')) return 'tiktok';
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'youtube';
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'twitter';
  if (lowercaseUrl.includes('linkedin.com')) return 'linkedin';
  return 'website';
};

// Helper para obtener icono/color de plataforma
export const getPlatformInfo = (platform: SocialPlatform) => {
  switch (platform) {
    case 'instagram':
      return { name: 'Instagram', color: 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500', icon: '📸' };
    case 'facebook':
      return { name: 'Facebook', color: 'bg-blue-600', icon: '👤' };
    case 'tiktok':
      return { name: 'TikTok', color: 'bg-black', icon: '🎵' };
    case 'youtube':
      return { name: 'YouTube', color: 'bg-red-600', icon: '▶️' };
    case 'twitter':
      return { name: 'X/Twitter', color: 'bg-gray-800', icon: '🐦' };
    case 'linkedin':
      return { name: 'LinkedIn', color: 'bg-blue-700', icon: '💼' };
    case 'website':
      return { name: 'Website', color: 'bg-green-600', icon: '🌐' };
    default:
      return { name: 'Otro', color: 'bg-gray-600', icon: '🔗' };
  }
};

export const getStatusInfo = (status: CaptacionStatus) => {
  switch (status) {
    case 'pendiente':
      return { label: 'Pendiente', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    case 'contactado':
      return { label: 'Contactado', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
    case 'en_negociacion':
      return { label: 'En Negociación', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
    case 'captado':
      return { label: '✓ Captado', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
    case 'descartado':
      return { label: 'Descartado', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
  }
};

export const getProjectTypeLabel = (type: ProjectType): string => {
  const labels: Record<ProjectType, string> = {
    apartamento: 'Apartamento',
    casa: 'Casa',
    villa: 'Villa',
    penthouse: 'Penthouse',
    local_comercial: 'Local Comercial',
    terreno: 'Terreno',
    proyecto_nuevo: 'Proyecto Nuevo',
    otro: 'Otro'
  };
  return labels[type];
};
