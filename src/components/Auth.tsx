import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'forgot-password';

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else if (mode === 'register') {
        if (!fullName.trim()) {
          throw new Error('El nombre completo es requerido');
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar (o inicia sesión si la confirmación está desactivada).');
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSuccess('¡Email enviado! Revisa tu bandeja de entrada para restablecer tu contraseña.');
      }
    } catch (e: any) {
      // Translate common Supabase errors to Spanish
      let errorMsg = e.message || 'Ocurrió un error';
      if (errorMsg.includes('Invalid login credentials')) {
        errorMsg = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      } else if (errorMsg.includes('Email not confirmed')) {
        errorMsg = 'Email no confirmado. Revisa tu bandeja de entrada o contacta al administrador.';
      } else if (errorMsg.includes('User already registered')) {
        errorMsg = 'Este email ya está registrado. Intenta iniciar sesión.';
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderTabs = () => {
    if (mode === 'forgot-password') return null;
    
    return (
      <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            mode === 'login' 
              ? 'bg-white shadow text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => { setMode('register'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
            mode === 'register' 
              ? 'bg-white shadow text-blue-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Registrarse
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white font-bold">N</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">NEXUS CRM</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === 'forgot-password' ? 'Restablecer Contraseña' : 'Real Estate Management System'}
          </p>
        </div>

        {/* Tabs */}
        {renderTabs()}

        {/* Back button for forgot password */}
        {mode === 'forgot-password' && (
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
            className="mb-4 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            ← Volver a iniciar sesión
          </button>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder-gray-400"
                placeholder="Juan Pérez"
                required={mode === 'register'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder-gray-400"
              placeholder="tu@email.com"
              required
            />
          </div>

          {mode !== 'forgot-password' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-gray-900 placeholder-gray-400"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          {/* Forgot Password Link */}
          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => { setMode('forgot-password'); setError(''); setSuccess(''); }}
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm p-3 rounded-lg bg-red-50 text-red-600">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="text-sm p-3 rounded-lg bg-green-50 text-green-600">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading 
              ? 'Procesando...' 
              : mode === 'login' 
                ? 'Iniciar Sesión' 
                : mode === 'register'
                  ? 'Crear Cuenta'
                  : 'Enviar Email de Recuperación'
            }
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-400">
          <p>NEXUS CRM v2.0 - Powered by Supabase</p>
        </div>
      </div>
    </div>
  );
}
