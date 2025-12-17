import React, { useState } from 'react';
import { Home, Users, Building, BarChart3, Menu, Settings, X, ClipboardList, LogOut, Shield, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUserRole } from '../hooks/useUserRole';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { canViewTeam, role } = useUserRole();
  
  // Get agent name from user metadata
  const agentName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Agente';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'leads', label: 'Leads Flow', icon: Users },
    { id: 'automations', label: 'Auto', icon: Zap },
    { id: 'activities', label: 'Marketing', icon: ClipboardList },
    { id: 'inventory', label: 'Captaciones', icon: Building },
    { id: 'analytics', label: 'Métricas', icon: BarChart3 },
    { id: 'architecture', label: 'Configuraciones', icon: Settings },
    // SuperAdmin only visible for supervisors/admins
    ...(canViewTeam ? [{ id: 'superadmin', label: 'SuperAdmin', icon: Shield }] : []),
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-nexus-base text-nexus-text font-sans">
      {/* Top Mobile Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-nexus-surface border-b border-white/10 sticky top-0 z-50">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className="text-xl font-bold tracking-wider text-nexus-accent hover:text-orange-400 transition-colors"
        >
          ALVEARE
        </button>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-16 w-64 bg-nexus-surface border-l border-white/10 h-full shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <nav className="p-4 space-y-2 flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive 
                        ? 'bg-nexus-accent text-nexus-base font-bold' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={20} className={`mr-3 ${isActive ? 'text-nexus-base' : 'text-nexus-accent'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            
            {/* Mobile Logout Button */}
            <div className="p-4 border-t border-white/10">
              <button
                onClick={signOut}
                className="flex items-center w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} className="mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex h-screen overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex flex-col w-64 bg-nexus-surface border-r border-white/10">
          <div className="p-6">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="text-2xl font-bold tracking-widest text-nexus-accent hover:text-orange-400 transition-colors"
            >
              ALVEARE
            </button>
            <p className="text-sm text-white mt-1 font-medium">{agentName}</p>
          </div>
          
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center w-full px-4 py-3 rounded-lg transition-all duration-200 group ${
                    isActive 
                      ? 'bg-nexus-accent text-nexus-base font-bold shadow-[0_0_15px_rgba(255,133,27,0.4)]' 
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={`mr-3 ${isActive ? 'text-nexus-base' : 'text-nexus-accent'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  canViewTeam 
                    ? 'bg-gradient-to-tr from-purple-500 to-pink-500' 
                    : 'bg-gradient-to-tr from-nexus-accent to-purple-500'
                }`}>
                  {canViewTeam && <Shield size={14} className="text-white" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[120px]">{agentName}</p>
                  <p className="text-xs text-green-400">
                    {canViewTeam ? `● ${role === 'admin' ? 'Admin' : 'Supervisor'}` : '● Online'}
                  </p>
                </div>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Cerrar sesión"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 w-full bg-nexus-surface border-t border-white/10 flex justify-around p-3 z-50 safe-area-pb">
        {navItems.slice(0, 4).map((item) => {
           const Icon = item.icon;
           const isActive = activeTab === item.id;
           return (
             <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isActive ? 'text-nexus-accent' : 'text-gray-500'}`}
             >
               <Icon size={24} />
               <span className="text-[10px] mt-1">{item.label}</span>
             </button>
           )
        })}
      </div>
    </div>
  );
};

export default Layout;
