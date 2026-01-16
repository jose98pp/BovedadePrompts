
import React from 'react';
import { ICONS } from '../constants';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: { nombre: string; email: string };
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar - Hidden on mobile, show on md+ */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
            <ICONS.Sparkles size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Bóveda IA
          </h1>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 text-indigo-700 bg-indigo-50 rounded-lg font-medium">
            <ICONS.LayoutGrid size={20} />
            Dashboard
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <ICONS.Star size={20} />
            Favoritos
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <ICONS.Tag size={20} />
            Categorías
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <ICONS.Download size={20} />
            Exportar
          </button>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold uppercase">
              {user.nombre[0]}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold truncate">{user.nombre}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <ICONS.LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200">
           <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
              <ICONS.Sparkles size={18} />
            </div>
            <h1 className="text-lg font-bold">Bóveda IA</h1>
          </div>
          <button onClick={onLogout} className="p-2 text-slate-600">
            <ICONS.LogOut size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
