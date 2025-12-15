import React, { useState } from 'react';
import type { Property } from '../types';
import { MapPin, Home, Bed, Bath } from 'lucide-react';
import Modal from './Modal';
import PropertyForm from './PropertyForm';
import PropertyDetail from './PropertyDetail';

interface InventoryViewProps {
  properties: Property[];
  addProperty?: (property: Property) => void;
}

const InventoryView: React.FC<InventoryViewProps> = ({ properties, addProperty }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const handleSaveProperty = (property: Property) => {
    if (addProperty) {
      addProperty(property);
    }
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Inventario (Captaciones)</h2>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-nexus-accent text-nexus-base font-bold px-4 py-2 rounded text-sm hover:bg-orange-400 transition-colors"
        >
           + Nueva Propiedad
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(prop => (
          <div 
            key={prop.id} 
            className="bg-nexus-surface rounded-xl overflow-hidden border border-white/5 flex flex-col hover:-translate-y-1 transition-transform duration-300 shadow-lg cursor-pointer"
            onClick={() => setSelectedProperty(prop)}
          >
            <div className="h-48 bg-gray-700 relative">
               <img src={prop.imageUrl} alt={prop.title} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
               <span className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-bold border border-white/10">
                 {prop.status}
               </span>
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="text-lg font-bold text-white truncate">{prop.title}</h3>
              <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">
                <MapPin size={14} className="text-nexus-accent" /> {prop.address}
              </p>

              <div className="flex gap-4 my-4 text-sm text-gray-300">
                <div className="flex items-center gap-1"><Bed size={16}/> {prop.bedrooms}</div>
                <div className="flex items-center gap-1"><Bath size={16}/> {prop.bathrooms}</div>
                <div className="flex items-center gap-1"><Home size={16}/> {prop.sqMeters}m²</div>
              </div>

              <div className="mt-auto pt-4 border-t border-white/10 flex justify-between items-center">
                 <div className="text-xl font-bold text-nexus-accent flex items-center">
                   {prop.price.toLocaleString()} €
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setSelectedProperty(prop); }}
                   className="text-xs text-blue-400 hover:text-blue-300 underline"
                 >
                   Ver Ficha
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No hay propiedades en el inventario</p>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="text-nexus-accent hover:underline mt-2"
          >
            Agregar primera propiedad
          </button>
        </div>
      )}

      {/* Modal: New Property Form */}
      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Nueva Propiedad">
        <PropertyForm onSave={handleSaveProperty} onCancel={() => setIsFormOpen(false)} />
      </Modal>

      {/* Modal: Property Detail */}
      <Modal isOpen={!!selectedProperty} onClose={() => setSelectedProperty(null)} title="Detalle de Propiedad">
        {selectedProperty && (
          <PropertyDetail property={selectedProperty} onClose={() => setSelectedProperty(null)} />
        )}
      </Modal>
    </div>
  );
};

export default InventoryView;
