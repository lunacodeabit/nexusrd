import { useState, useEffect, useCallback } from 'react';
import type { Captacion } from '../types/captaciones';

const STORAGE_KEY = 'nexus_captaciones';

export function useCaptaciones() {
  const [captaciones, setCaptaciones] = useState<Captacion[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(false);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(captaciones));
  }, [captaciones]);

  const addCaptacion = useCallback((captacion: Omit<Captacion, 'id' | 'createdAt'>) => {
    const newCaptacion: Captacion = {
      ...captacion,
      id: `cap-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCaptaciones(prev => [newCaptacion, ...prev]);
    return newCaptacion;
  }, []);

  const updateCaptacion = useCallback((id: string, updates: Partial<Captacion>) => {
    setCaptaciones(prev => prev.map(cap => 
      cap.id === id 
        ? { ...cap, ...updates, updatedAt: new Date().toISOString() }
        : cap
    ));
  }, []);

  const deleteCaptacion = useCallback((id: string) => {
    setCaptaciones(prev => prev.filter(cap => cap.id !== id));
  }, []);

  // Extraer palabras clave de la descripción del post
  const extractKeywords = (text: string): string[] => {
    if (!text) return [];
    
    // Palabras comunes a ignorar
    const stopWords = ['el', 'la', 'los', 'las', 'de', 'del', 'en', 'un', 'una', 'y', 'o', 'a', 'que', 'es', 'por', 'para', 'con', 'su', 'tu', 'mi', 'al', 'se', 'lo', 'como', 'más', 'este', 'esta', 'estos', 'estas', 'hay', 'tiene', 'son', 'está', 'muy', 'sin', 'sobre', 'entre', 'cuando', 'todo', 'esta', 'ser', 'nos', 'ya', 'pero', 'sus', 'le', 'ha', 'me', 'si', 'te', 'tan', 'solo', 'bien', 'aquí', 'donde'];
    
    // Limpiar y extraer palabras relevantes
    const words = text
      .toLowerCase()
      .replace(/[^\w\sáéíóúñü]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));
    
    // Buscar patrones importantes
    const patterns = {
      project: text.match(/(?:proyecto|torre[s]?|residencial|edificio)\s+[\w\sáéíóúñü]+/gi) || [],
      location: text.match(/(?:en|ubicado|sector|zona)\s+[\w\sáéíóúñü]+/gi) || [],
      developer: text.match(/(?:constructora|desarrolladora|by|construido por)\s+[\w\sáéíóúñü]+/gi) || [],
      price: text.match(/(?:desde|precio|rd\$|us\$|usd|\$)\s*[\d,.]+/gi) || [],
    };
    
    // Combinar resultados únicos
    const allKeywords = [...new Set([
      ...patterns.project.map(p => p.trim()),
      ...patterns.location.map(l => l.trim()),
      ...patterns.developer.map(d => d.trim()),
      ...words.slice(0, 10) // Top 10 palabras más relevantes
    ])];
    
    return allKeywords.slice(0, 15);
  };

  // Construir query de búsqueda profunda específica para RD
  const buildSearchQuery = (captacion: Captacion): string => {
    const projectName = captacion.projectName || '';
    const developerName = captacion.developerName || '';
    const location = captacion.location || '';
    const postDescription = captacion.postDescription || '';
    
    // Extraer keywords de la descripción del post
    const keywords = extractKeywords(postDescription);
    
    // Si tenemos descripción del post, usarla inteligentemente
    if (postDescription && !projectName && !developerName) {
      // Buscar usando las keywords extraídas
      const keywordString = keywords.slice(0, 5).join(' ');
      return `${keywordString} constructora desarrolladora teléfono contacto "República Dominicana"`;
    }
    
    // Query principal enfocada en contacto de constructora en RD
    const mainQuery = [
      projectName ? `"${projectName}"` : '',
      developerName ? `"${developerName}"` : '',
      'constructora OR desarrolladora OR promotora',
      'teléfono OR celular OR WhatsApp OR contacto OR email',
      location ? `"${location}"` : '',
      '"República Dominicana" OR "Santo Domingo" OR "Punta Cana" OR "Santiago"'
    ].filter(Boolean).join(' ');
    
    return mainQuery;
  };

  const searchWithAI = useCallback(async (captacion: Captacion): Promise<{ google: string; maps: string; linkedin: string; perplexity: string }> => {
    setLoading(true);
    
    const projectName = captacion.projectName || '';
    const location = captacion.location || '';
    const developerName = captacion.developerName || '';
    const postDescription = captacion.postDescription || '';
    
    // Extraer keywords de la descripción
    const keywords = extractKeywords(postDescription);
    const keywordString = keywords.slice(0, 5).join(' ');
    
    // Determinar qué información tenemos para buscar
    const searchTerm = developerName || projectName || keywordString || 'proyecto inmobiliario';
    const locationTerm = location || 'República Dominicana';
    
    // Búsqueda Google - Contacto de constructora
    const googleQuery = buildSearchQuery(captacion);
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
    
    // Búsqueda Google Maps - Para encontrar oficina física
    const mapsQuery = `${searchTerm} constructora inmobiliaria ${locationTerm}`;
    const mapsSearchUrl = `https://www.google.com/maps/search/${encodeURIComponent(mapsQuery)}`;
    
    // Búsqueda LinkedIn - Para encontrar ejecutivos de la constructora
    const linkedinQuery = `${searchTerm} constructora desarrolladora inmobiliaria República Dominicana`;
    const linkedinSearchUrl = `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(linkedinQuery)}`;
    
    // Búsqueda Perplexity - Búsqueda profunda con IA
    const perplexityQuery = postDescription 
      ? `Encuentra la información de contacto (teléfono, WhatsApp, email) de la constructora o desarrolladora de este proyecto inmobiliario en República Dominicana. Descripción del post: "${postDescription.slice(0, 500)}"`
      : `Encuentra la información de contacto de la constructora "${searchTerm}" en ${locationTerm}, República Dominicana`;
    const perplexitySearchUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(perplexityQuery)}`;

    setLoading(false);
    
    return {
      google: googleSearchUrl,
      maps: mapsSearchUrl,
      linkedin: linkedinSearchUrl,
      perplexity: perplexitySearchUrl
    };
  }, []);

  // Búsqueda con Perplexity (preparado para futuro)
  const searchWithPerplexity = useCallback(async (captacion: Captacion): Promise<string | null> => {
    // TODO: Integrar Perplexity API cuando esté disponible
    // const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY;
    // if (!PERPLEXITY_API_KEY) return null;
    
    const _query = `Busca información de contacto (teléfono, WhatsApp, email) de la constructora o desarrolladora del proyecto inmobiliario "${captacion.projectName}" ubicado en ${captacion.location || 'República Dominicana'}. Solo me interesan proyectos en República Dominicana. Necesito el nombre de la empresa, número de teléfono y cualquier forma de contacto disponible.`;
    
    // const response = await fetch('https://api.perplexity.ai/chat/completions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     model: 'llama-3.1-sonar-small-128k-online',
    //     messages: [{ role: 'user', content: query }]
    //   })
    // });
    
    return null;
  }, []);

  return {
    captaciones,
    loading,
    addCaptacion,
    updateCaptacion,
    deleteCaptacion,
    searchWithAI,
    searchWithPerplexity
  };
}
