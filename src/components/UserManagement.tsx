import { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Search,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  Crown
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useUserRole } from '../hooks/useUserRole';
import type { UserProfile, UserRole } from '../types';

export default function UserManagement() {
  const { isAdmin, isSupervisor, canManageUsers, profile: currentUser } = useUserRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('role', { ascending: true })
        .order('full_name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('No se pudieron cargar los usuarios. ¿Ejecutaste el SQL de migración?');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    if (!canManageUsers) {
      setError('No tienes permisos para cambiar roles');
      return;
    }

    // Supervisores solo pueden asignar rol de asesor
    if (isSupervisor && !isAdmin && (newRole === 'supervisor' || newRole === 'admin')) {
      setError('Solo los administradores pueden crear supervisores o admins');
      return;
    }

    // No permitir que supervisores modifiquen a otros supervisores o admins
    const targetUser = users.find(u => u.id === userId);
    if (isSupervisor && !isAdmin && targetUser && (targetUser.role === 'supervisor' || targetUser.role === 'admin')) {
      setError('No puedes modificar el rol de supervisores o administradores');
      return;
    }

    if (userId === currentUser?.id && newRole !== 'admin') {
      setError('No puedes quitarte el rol de admin a ti mismo');
      return;
    }

    setUpdating(userId);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));

      const user = users.find(u => u.id === userId);
      setSuccess(`${user?.full_name || 'Usuario'} ahora es ${getRoleLabel(newRole)}`);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Error al actualizar el rol');
    } finally {
      setUpdating(null);
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    if (!canManageUsers) {
      setError('No tienes permisos para activar/desactivar usuarios');
      return;
    }

    // Supervisores no pueden desactivar otros supervisores o admins
    const targetUser = users.find(u => u.id === userId);
    if (isSupervisor && !isAdmin && targetUser && (targetUser.role === 'supervisor' || targetUser.role === 'admin')) {
      setError('No puedes desactivar supervisores o administradores');
      return;
    }

    if (userId === currentUser?.id) {
      setError('No puedes desactivarte a ti mismo');
      return;
    }

    setUpdating(userId);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_active: isActive } : u
      ));

      const user = users.find(u => u.id === userId);
      setSuccess(`${user?.full_name || 'Usuario'} ${isActive ? 'activado' : 'desactivado'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error toggling user:', err);
      setError('Error al cambiar estado del usuario');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: UserRole): string => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'asesor': return 'Asesor';
      default: return role;
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4" />;
      case 'supervisor': return <ShieldCheck className="w-4 h-4" />;
      case 'asesor': return <Users className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role: UserRole): string => {
    switch (role) {
      case 'admin': return 'text-purple-400 bg-purple-500/20';
      case 'supervisor': return 'text-blue-400 bg-blue-500/20';
      case 'asesor': return 'text-gray-400 bg-gray-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  if (!canManageUsers) {
    return (
      <div className="text-center py-12">
        <ShieldAlert className="w-16 h-16 mx-auto text-red-400 mb-4" />
        <h2 className="text-xl font-semibold text-white mb-2">Acceso Denegado</h2>
        <p className="text-gray-400">Solo administradores y supervisores pueden gestionar usuarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCog className="w-6 h-6 text-nexus-accent" />
            Gestión de Usuarios
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            Administra roles y permisos del equipo
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="p-2 bg-nexus-surface rounded-lg text-gray-400 hover:text-white transition-colors"
          title="Recargar"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-400">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nombre o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-nexus-surface border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-nexus-accent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-nexus-surface rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'admin').length}
          </p>
          <p className="text-purple-400 text-sm flex items-center justify-center gap-1">
            <Crown className="w-3 h-3" /> Admins
          </p>
        </div>
        <div className="bg-nexus-surface rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'supervisor').length}
          </p>
          <p className="text-blue-400 text-sm flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Supervisores
          </p>
        </div>
        <div className="bg-nexus-surface rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-white">
            {users.filter(u => u.role === 'asesor').length}
          </p>
          <p className="text-gray-400 text-sm flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> Asesores
          </p>
        </div>
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 mx-auto text-nexus-accent animate-spin mb-4" />
          <p className="text-gray-400">Cargando usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">
            {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map(user => (
            <div
              key={user.id}
              className={`bg-nexus-surface rounded-lg p-4 flex items-center gap-4 ${
                !user.is_active ? 'opacity-60' : ''
              }`}
            >
              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getRoleColor(user.role)}`}>
                {getRoleIcon(user.role)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white font-medium truncate">
                    {user.full_name || 'Sin nombre'}
                  </p>
                  {user.id === currentUser?.id && (
                    <span className="px-2 py-0.5 bg-nexus-accent/20 text-nexus-accent text-xs rounded">
                      Tú
                    </span>
                  )}
                  {!user.is_active && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">
                      Inactivo
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-sm truncate">{user.email}</p>
              </div>

              {/* Role Selector */}
              <div className="flex items-center gap-2">
                {/* Supervisores no pueden editar a otros supervisores/admins */}
                {isSupervisor && !isAdmin && (user.role === 'supervisor' || user.role === 'admin') ? (
                  <span className={`px-3 py-2 rounded-lg text-sm ${getRoleColor(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                ) : (
                  <select
                    value={user.role}
                    onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                    disabled={updating === user.id || user.id === currentUser?.id}
                    className={`bg-nexus-base border border-gray-700 rounded-lg px-3 py-2 text-sm ${getRoleColor(user.role).split(' ')[0]} focus:outline-none focus:border-nexus-accent disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="asesor">Asesor</option>
                    {/* Solo admins pueden asignar supervisor o admin */}
                    {isAdmin && <option value="supervisor">Supervisor</option>}
                    {isAdmin && <option value="admin">Admin</option>}
                  </select>
                )}

                {/* Active Toggle */}
                {user.id !== currentUser?.id && (
                  <button
                    onClick={() => toggleUserActive(user.id, !user.is_active)}
                    disabled={updating === user.id}
                    className={`p-2 rounded-lg transition-colors ${
                      user.is_active
                        ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    } disabled:opacity-50`}
                    title={user.is_active ? 'Desactivar usuario' : 'Activar usuario'}
                  >
                    {user.is_active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <div className="bg-nexus-base rounded-lg p-4 text-sm text-gray-400">
        <p className="font-medium text-white mb-2">Niveles de acceso:</p>
        <ul className="space-y-1">
          <li className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-purple-400" />
            <span><strong className="text-purple-400">Admin:</strong> Control total + crear supervisores y admins</span>
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span><strong className="text-blue-400">Supervisor:</strong> Ve todo el equipo + gestiona asesores</span>
          </li>
          <li className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span><strong className="text-gray-400">Asesor:</strong> Solo ve sus propios datos</span>
          </li>
        </ul>
        {isSupervisor && !isAdmin && (
          <p className="mt-3 text-amber-400/80 text-xs">
            ⚠️ Como supervisor, puedes gestionar asesores pero no crear otros supervisores o admins.
          </p>
        )}
      </div>
    </div>
  );
}
