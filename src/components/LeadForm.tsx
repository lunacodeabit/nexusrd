import React, { useState, useRef } from 'react';
import type { Lead, Currency } from '../types';
import { LeadStatus } from '../types';

// Format phone number as xxx-xxx-xxxx
const formatPhoneNumber = (value: string): string => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
};

// Format money with commas: 1,234,567
const formatMoney = (value: number): string => {
  return value.toLocaleString('en-US');
};

interface LeadFormProps {
  onSave: (lead: Lead) => void;
  onCancel: () => void;
}

const LeadForm: React.FC<LeadFormProps> = ({ onSave, onCancel }) => {
  const budgetInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Website' as Lead['source'],
    budget: 0,
    budgetDisplay: '',
    currency: 'USD' as Currency,
    interestArea: '',
    notes: ''
  });

  // Handle phone input with formatting
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  // Handle budget input with formatting
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    if (rawValue === '' || /^\d+$/.test(rawValue)) {
      const numValue = parseInt(rawValue, 10) || 0;
      setFormData({
        ...formData,
        budget: numValue,
        budgetDisplay: rawValue === '' ? '' : formatMoney(numValue)
      });
    }
  };

  // Select all on focus if empty or zero
  const handleBudgetFocus = () => {
    if (formData.budget === 0 && budgetInputRef.current) {
      budgetInputRef.current.select();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLead: Lead = {
      id: `l-${Date.now()}`,
      name: formData.name || 'Sin nombre',
      email: formData.email,
      phone: formData.phone.replace(/-/g, ''), // Store without formatting
      source: formData.source,
      status: LeadStatus.NEW,
      budget: formData.budget,
      currency: formData.currency,
      interestArea: formData.interestArea,
      createdAt: new Date().toISOString(),
      nextFollowUpDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
      notes: formData.notes
    };

    onSave(newLead);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-gray-400 mb-1">Nombre completo *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
          placeholder="Ej: Juan García"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="email@ejemplo.com"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Teléfono *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={handlePhoneChange}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
            placeholder="809-555-1234"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Fuente</label>
          <select
            value={formData.source}
            onChange={(e) => setFormData({ ...formData, source: e.target.value as Lead['source'] })}
            className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
          >
            <option value="Website">Website</option>
            <option value="Idealista">Idealista</option>
            <option value="Instagram">Instagram</option>
            <option value="Referido">Referido</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Presupuesto</label>
          <div className="flex gap-1 sm:gap-2">
            <select
              value={formData.currency}
              onChange={(e) => setFormData({ ...formData, currency: e.target.value as Currency })}
              className="bg-nexus-base border border-white/10 rounded-lg px-2 py-2 text-nexus-accent font-bold focus:outline-none focus:border-nexus-accent text-sm flex-shrink-0"
            >
              <option value="USD">US$</option>
              <option value="RD$">RD$</option>
            </select>
            <input
              ref={budgetInputRef}
              type="text"
              inputMode="numeric"
              value={formData.budgetDisplay}
              onChange={handleBudgetChange}
              onFocus={handleBudgetFocus}
              className="min-w-0 flex-1 bg-nexus-base border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-nexus-accent text-right"
              placeholder="250,000"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Zona de interés</label>
        <input
          type="text"
          value={formData.interestArea}
          onChange={(e) => setFormData({ ...formData, interestArea: e.target.value })}
          className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent"
          placeholder="Ej: Centro, Zona Norte..."
        />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Notas</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full bg-nexus-base border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-nexus-accent resize-none"
          placeholder="Información adicional sobre el lead..."
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
          Guardar Lead
        </button>
      </div>
    </form>
  );
};

export default LeadForm;
