
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import PromptCard from './components/PromptCard';
import PromptModal from './components/PromptModal';
import IdeaModal from './components/IdeaModal';
import { Prompt, Categoria, ViewMode, ExportFormat } from './types';
import { ICONS, DEFAULT_CATEGORIES } from './constants';
import { promptService } from './services/promptService';
import { exportService } from './services/exportService';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [user, setUser] = useState<{ id: string; nombre: string; email: string } | null>(null);
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [dbCategories, setDbCategories] = useState<Categoria[]>([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');
  const [timeFilter, setTimeFilter] = useState('todos'); // todos, hoy, semana, mes
  const [sortBy, setSortBy] = useState('recientes'); // recientes, antiguos, actualizados
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.GRID);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isIdeaModalOpen, setIsIdeaModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false); 
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const initAuth = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        setUser({
          id: session.user.id,
          nombre: session.user.user_metadata.nombre || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || ''
        });
      }
    } catch (error: any) {
      console.error("Error inicializando auth:", error);
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        setConnectionError('Error de Red: No se puede conectar con el servidor de Supabase.');
      } else {
        setConnectionError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser({
          id: session.user.id,
          nombre: session.user.user_metadata.nombre || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || ''
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const loadData = async () => {
    if (!user) return;
    try {
      const [promptsData, categoriesData] = await Promise.all([
        promptService.getPrompts(),
        promptService.getCategories()
      ]);
      setPrompts(promptsData);
      setDbCategories(categoriesData);
      setConnectionError(null);
    } catch (err: any) {
      console.error("Error cargando datos:", err);
      showToast('Error al cargar datos remotos', 'error');
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const allCategories = useMemo(() => {
    const names = new Set(DEFAULT_CATEGORIES.map(c => c.nombre));
    const merged = [...DEFAULT_CATEGORIES];
    dbCategories.forEach(cat => {
      if (!names.has(cat.nombre)) {
        merged.push({ nombre: cat.nombre, color: cat.color });
      }
    });
    return merged;
  }, [dbCategories]);

  const filteredPrompts = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(now.getMonth() - 1);

    return prompts
      .filter(p => {
        const matchesSearch = p.titulo.toLowerCase().includes(search.toLowerCase()) || 
                             p.contenido.toLowerCase().includes(search.toLowerCase()) ||
                             p.etiquetas.some(t => t.toLowerCase().includes(search.toLowerCase()));
        const matchesCategory = filterCategory === 'Todas' || p.categoria === filterCategory;
        const matchesFavorite = !showOnlyFavorites || p.es_favorito;
        
        const createDate = new Date(p.creado_en);
        let matchesTime = true;
        if (timeFilter === 'hoy') matchesTime = createDate >= today;
        if (timeFilter === 'semana') matchesTime = createDate >= weekAgo;
        if (timeFilter === 'mes') matchesTime = createDate >= monthAgo;

        return matchesSearch && matchesCategory && matchesFavorite && matchesTime;
      })
      .sort((a, b) => {
        if (sortBy === 'recientes') return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime();
        if (sortBy === 'antiguos') return new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime();
        if (sortBy === 'actualizados') return new Date(b.actualizado_en).getTime() - new Date(a.actualizado_en).getTime();
        return 0;
      });
  }, [prompts, search, filterCategory, showOnlyFavorites, timeFilter, sortBy]);

  const validateForm = (data: FormData): boolean => {
    const errors: Record<string, string> = {};
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    
    if (isRegistering) {
      const nombre = data.get('nombre') as string;
      const confirmPassword = data.get('confirmPassword') as string;

      if (!nombre || nombre.trim().length < 3) {
        errors.nombre = "Mínimo 3 caracteres.";
      }
      if (password !== confirmPassword) {
        errors.confirmPassword = "Las claves no coinciden.";
      }
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email inválido.";
    }
    if (!password || password.length < 6) {
      errors.password = "Mínimo 6 caracteres.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setConnectionError(null);
    
    const formData = new FormData(e.currentTarget);
    if (!validateForm(formData)) return;

    setAuthLoading(true);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const nombre = formData.get('nombre') as string;

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nombre: nombre.trim() }
          }
        });
        if (error) throw error;
        showToast('¡Cuenta creada! Verifica tu email.', 'success');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Acceso concedido.');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setPrompts([]);
  };

  const handleSavePrompt = async (data: Partial<Prompt>) => {
    try {
      await promptService.savePrompt(data);
      setIsPromptModalOpen(false);
      setEditingPrompt(null);
      loadData();
      showToast(data.id ? 'Prompt actualizado' : 'Prompt guardado');
    } catch (err: any) {
      showToast('Error: ' + err.message, 'error');
    }
  };

  const handleDeletePrompt = async (id: string) => {
    if (confirm('¿Eliminar definitivamente?')) {
      try {
        await promptService.deletePrompt(id);
        loadData();
        showToast('Prompt eliminado', 'info');
      } catch (err: any) {
        showToast('Error al eliminar', 'error');
      }
    }
  };

  const handleToggleFavorite = async (p: Prompt) => {
    try {
      await promptService.savePrompt({ ...p, es_favorito: !p.es_favorito });
      setPrompts(prompts.map(item => item.id === p.id ? {...item, es_favorito: !item.es_favorito} : item));
    } catch (err: any) {
      showToast('Error de sincronización', 'error');
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Copiado');
  };

  const handleExport = (format: ExportFormat) => {
    exportService.exportPrompts(filteredPrompts, format);
    showToast(`Exportado como ${format.toUpperCase()}`);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center gap-8 z-[200]">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-bold text-sm tracking-widest animate-pulse uppercase">Cargando Bóveda...</p>
      </div>
    );
  }

  if (connectionError && !user) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 text-center z-[200]">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-red-50">
          <ICONS.XCircle size={64} className="text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-900 mb-4 tracking-tighter">Error de Conexión</h2>
          <p className="text-slate-500 text-sm font-medium mb-8">{connectionError}</p>
          <button onClick={() => window.location.reload()} className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3">
            <ICONS.Zap size={20} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] w-full max-w-md border border-slate-100 flex flex-col relative animate-fade-in transition-all duration-500 hover:shadow-[0_48px_80px_-20px_rgba(79,70,229,0.15)]">
          {/* Decorative Top Bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1.5 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 rounded-b-full"></div>
          
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-200 rotate-6 transform hover:rotate-0 transition-transform duration-700">
              <ICONS.Sparkles size={36} />
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Bóveda IA</h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2 bg-slate-50 px-3 py-1 rounded-full">
              {isRegistering ? 'ÚNETE Y ORGANIZA TUS PROMPTS' : 'GESTIÓN INTELIGENTE'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            {isRegistering && (
              <div className="flex flex-col gap-2 animate-bounce-in">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                <div className="relative group">
                  <ICONS.User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    name="nombre" 
                    type="text" 
                    placeholder="Tu nombre real" 
                    className={`w-full bg-slate-50 border ${formErrors.nombre ? 'border-red-400' : 'border-slate-100'} rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm`} 
                  />
                </div>
                {formErrors.nombre && <span className="text-[10px] font-bold text-red-500 ml-2 mt-1">{formErrors.nombre}</span>}
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
              <div className="relative group">
                <ICONS.Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  name="email" 
                  type="email" 
                  placeholder="ejemplo@email.com" 
                  className={`w-full bg-slate-50 border ${formErrors.email ? 'border-red-400' : 'border-slate-100'} rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm`} 
                />
              </div>
              {formErrors.email && <span className="text-[10px] font-bold text-red-500 ml-2 mt-1">{formErrors.email}</span>}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Clave de Acceso</label>
              <div className="relative group">
                <ICONS.Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Mínimo 6 caracteres" 
                  className={`w-full bg-slate-50 border ${formErrors.password ? 'border-red-400' : 'border-slate-100'} rounded-2xl pl-12 pr-12 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm`} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors p-1">
                  {showPassword ? <ICONS.EyeOff size={18} /> : <ICONS.Eye size={18} />}
                </button>
              </div>
              {formErrors.password && <span className="text-[10px] font-bold text-red-500 ml-2 mt-1">{formErrors.password}</span>}
            </div>

            {isRegistering && (
              <div className="flex flex-col gap-2 animate-bounce-in">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Clave</label>
                <div className="relative group">
                  <ICONS.Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    name="confirmPassword" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Repite tu contraseña" 
                    className={`w-full bg-slate-50 border ${formErrors.confirmPassword ? 'border-red-400' : 'border-slate-100'} rounded-2xl pl-12 pr-4 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300 text-sm`} 
                  />
                </div>
                {formErrors.confirmPassword && <span className="text-[10px] font-bold text-red-500 ml-2 mt-1">{formErrors.confirmPassword}</span>}
              </div>
            )}

            <button 
              disabled={authLoading} 
              type="submit" 
              className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 shadow-2xl shadow-indigo-100/50 mt-4 group"
            >
              {authLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                isRegistering ? <ICONS.Plus size={20} className="group-hover:rotate-90 transition-transform" /> : <ICONS.ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              )}
              {authLoading ? 'Sincronizando...' : (isRegistering ? 'Crear mi Bóveda' : 'Acceder al Sistema')}
            </button>
          </form>

          <button 
            onClick={() => { setIsRegistering(!isRegistering); setFormErrors({}); }} 
            className="mt-10 text-xs font-black text-indigo-600 hover:text-white hover:bg-indigo-600 transition-all uppercase tracking-widest bg-indigo-50 px-8 py-3.5 rounded-2xl self-center active:scale-95"
          >
            {isRegistering ? '¿YA ERES USUARIO? LOGIN' : '¿NO TIENES CUENTA? REGISTRO'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
            <div className={`px-8 py-4 rounded-[1.5rem] shadow-2xl flex items-center gap-4 font-black text-sm text-white border-2 border-white/20 backdrop-blur-md ${toast.type === 'error' ? 'bg-red-500' : 'bg-slate-900'}`}>
              {toast.type === 'error' ? <ICONS.XCircle size={22} /> : <ICONS.Sparkles size={22} className="text-indigo-400" />}
              {toast.message}
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-5xl font-black text-slate-900 tracking-tighter">Bóveda Personal</h2>
            <div className="flex items-center gap-3 mt-3">
              <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                Cloud Sincronizado
              </div>
              <p className="text-slate-400 font-bold text-sm tracking-tight">Hola, {user.nombre}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => setIsIdeaModalOpen(true)} className="flex items-center gap-3 px-6 py-4 rounded-[1.25rem] bg-white border border-slate-200 font-black text-sm text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 group">
              <ICONS.Zap size={20} className="fill-indigo-600 group-hover:scale-125 transition-transform" /> 
              Gen IA Idea
            </button>
            <button onClick={() => { setEditingPrompt(null); setIsPromptModalOpen(true); }} className="flex items-center gap-3 px-8 py-4 rounded-[1.25rem] bg-slate-900 text-white font-black text-sm hover:bg-indigo-600 transition-all shadow-2xl active:scale-95">
              <ICONS.Plus size={20} /> 
              Nuevo Prompt
            </button>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[3rem] p-8 md:p-10 shadow-sm flex flex-col gap-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-center">
            <div className="xl:col-span-5 relative group">
              <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Buscar en tu base de conocimiento..." 
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-16 pr-8 py-5 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-bold text-slate-800 placeholder:text-slate-300" 
              />
            </div>
            
            <div className="xl:col-span-7 flex flex-wrap lg:flex-nowrap items-center gap-3">
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 font-black text-slate-800 cursor-pointer text-sm"
              >
                <option value="Todas">Todas las áreas</option>
                {allCategories.map(cat => <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>)}
              </select>

              <select 
                value={timeFilter} 
                onChange={e => setTimeFilter(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 font-black text-slate-800 cursor-pointer text-sm"
              >
                <option value="todos">Cualquier fecha</option>
                <option value="hoy">Hoy mismo</option>
                <option value="semana">Última semana</option>
                <option value="mes">Último mes</option>
              </select>

              <select 
                value={sortBy} 
                onChange={e => setSortBy(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5 font-black text-slate-800 cursor-pointer text-sm"
              >
                <option value="recientes">Recientes</option>
                <option value="antiguos">Antiguos</option>
                <option value="actualizados">Actualizados</option>
              </select>

              <button 
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                className={`p-5 rounded-2xl transition-all border-2 ${showOnlyFavorites ? 'bg-amber-50 border-amber-200 text-amber-500 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-300 hover:bg-slate-100'}`}
              >
                <ICONS.Star size={24} fill={showOnlyFavorites ? 'currentColor' : 'none'} />
              </button>

              <div className="flex bg-slate-100 p-2 rounded-2xl border border-slate-200">
                <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-3.5 rounded-xl transition-all ${viewMode === ViewMode.GRID ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <ICONS.LayoutGrid size={22} />
                </button>
                <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-3.5 rounded-xl transition-all ${viewMode === ViewMode.LIST ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                  <ICONS.List size={22} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-50 pt-8 gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando <span className="text-slate-900">{filteredPrompts.length}</span> activos en el repositorio
            </span>
            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl">
              {['json', 'csv', 'md'].map(fmt => (
                <button key={fmt} onClick={() => handleExport(fmt as any)} className="px-5 py-2.5 text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all uppercase tracking-widest bg-white/50">Exportar {fmt}</button>
              ))}
            </div>
          </div>
        </div>

        {filteredPrompts.length > 0 ? (
          <div className={viewMode === ViewMode.GRID ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8" : "flex flex-col gap-6"}>
            {filteredPrompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onEdit={(p) => { setEditingPrompt(p); setIsPromptModalOpen(true); }}
                onDelete={handleDeletePrompt}
                onToggleFavorite={handleToggleFavorite}
                onCopy={handleCopy}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-40 bg-white border-4 border-dashed border-slate-100 rounded-[4rem] group hover:border-indigo-100 transition-colors text-center">
            <ICONS.BookOpen size={64} className="text-slate-200 mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Tu bóveda está vacía</h3>
            <p className="text-slate-400 mt-3 font-bold text-sm max-w-sm px-6">Empieza a crear conocimiento o usa la IA para generar ideas rápidas y profesionales.</p>
          </div>
        )}
      </div>

      <PromptModal isOpen={isPromptModalOpen} onClose={() => { setIsPromptModalOpen(false); setEditingPrompt(null); }} onSave={handleSavePrompt} editingPrompt={editingPrompt} />
      <IdeaModal isOpen={isIdeaModalOpen} onClose={() => setIsIdeaModalOpen(false)} onGenerated={(titulo, contenido) => { setEditingPrompt(null); handleSavePrompt({ titulo, contenido }); }} />
    </Layout>
  );
};

export default App;
