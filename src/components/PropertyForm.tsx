import React, { useState } from 'react';
import type { Property } from '../types';
import { PropertyStatus } from '../types';

interface PropertyFormProps {
  onSave: (property: Property) => void;
  onCancel: () => void;
}

const PropertyForm: React.FC<PropertyFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    price: '',
    bedrooms: '',
    bathrooms: '',
    sqMeters: '',
    ownerName: '',
    ownerPhone: '',
    imageUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProperty: Property = {
      id: `p-${Date.now()}`,
      title: formData.title || 'Sin título',
      address: formData.address,
      price: Number(formData.price) || 0,
      status: PropertyStatus.AVAILABLE,
      bedrooms: Number(formData.bedrooms) || 0,
      bathrooms: Number(formData.bathrooms) || 0,
      sqMeters: Number(formData.sqMeters) || 0,
      imageUrl: formData.imageUrl || `https://picsum.photos/400/300?random=${Date.now()}`,
      ownerName: formData.ownerName,
      ownerPhone: formData.ownerPhone
    };

    onSave(newProperty);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Título de la propiedad *</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
          placeholder="Ej: Ático céntrico con terraza"
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Dirección *</label>
        <input
          type="text"
          required
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
          placeholder="Calle Mayor 45, 4A"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Precio (RD$) *</label>
          <input
            type="number"
            required
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="350000"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Metros² *</label>
          <input
            type="number"
            required
            value={formData.sqMeters}
            onChange={(e) => setFormData({ ...formData, sqMeters: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="120"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Habitaciones</label>
          <input
            type="number"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="3"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Baños</label>
          <input
            type="number"
            value={formData.bathrooms}
            onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="2"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Nombre propietario</label>
          <input
            type="text"
            value={formData.ownerName}
            onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="Luis García"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Teléfono propietario</label>
          <input
            type="tel"
            value={formData.ownerPhone}
            onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="+34 600 000 000"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">URL de imagen (opcional)</label>
        <input
          type="url"
          value={formData.imageUrl}
          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-white/20 text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-nexus-accent text-nexus-base font-bold rounded-lg hover:bg-orange-400 transition-colors"
        >
          Guardar Propiedad
        </button>
      </div>
    </form>
  );
};

export default PropertyForm;
