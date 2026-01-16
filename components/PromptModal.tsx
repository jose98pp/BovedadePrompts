
import React, { useState, useEffect } from 'react';
import { Prompt, PromptVersion } from '../types';
import { ICONS, DEFAULT_CATEGORIES } from '../constants';
import { geminiService } from '../services/geminiService';
import { promptService } from '../services/promptService';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (prompt: Partial<Prompt>) => void;
  editingPrompt: Prompt | null;
}

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, editingPrompt }) => {
  const [form, setForm] = useState<Partial<Prompt>>({
    titulo: '',
    contenido: '',
    descripcion: '',
    categoria: 'Marketing',
    etiquetas: [],
    es_favorito: false,
    calidad_score: 0,
    calidad_feedback: '',
    tono: ''
  });
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (editingPrompt) {
      setForm(editingPrompt);
      loadVersions(editingPrompt.id);
    } else {
      setForm({
        titulo: '',
        contenido: '',
        descripcion: '',
        categoria: 'Marketing',
        etiquetas: [],
        es_favorito: false,
        calidad_score: 0,
        calidad_feedback: '',
        tono: ''
      });
      setVersions([]);
    }
    setShowHistory(false);
  }, [editingPrompt, isOpen]);

  const loadVersions = async (id: string) => {
    const data = await promptService.getPromptVersions(id);
    setVersions(data);
  };

  const handleImproveContent = async () => {
    if (!form.contenido) return;
    setIsImproving(true);
    try {
      const improved = await geminiService.mejorarPrompt(form.contenido);
      setForm({ ...form, contenido: improved });
    } finally {
      setIsImproving(false);
    }
  };

  const handleAnalyzeQuality = async () => {
    if (!form.contenido) return;
    setIsAnalyzing(true);
    try {
      const result = await geminiService.analizarCalidad(form.contenido);
      setForm({ 
        ...form, 
        calidad_score: result.score, 
        calidad_feedback: result.feedback,
        tono: result.tono 
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const revertToVersion = (version: PromptVersion) => {
    if (confirm('¿Estás seguro de que quieres revertir a esta versión? Perderás los cambios no guardados en la versión actual.')) {
      setForm({
        ...form,
        titulo: version.titulo,
        contenido: version.contenido
      });
      setShowHistory(false);
    }
  };

  const detectVariables = () => {
    const matches = form.contenido?.match(/\{\{(.*?)\}\}/g);
    return matches ? Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '')))) : [];
  };

  if (!isOpen) return null;

  const variables = detectVariables();

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <ICONS.Sparkles size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {editingPrompt ? 'Perfeccionar Prompt' : 'Nuevo Activo IA'}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Configuración, Análisis e Historial</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingPrompt && (
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className={`p-3.5 rounded-2xl transition-all flex items-center gap-2 font-black text-xs ${showHistory ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-100 hover:bg-slate-50'}`}
              >
                <ICONS.Clock size={20} />
                {showHistory ? 'OCULTAR HISTORIAL' : 'VER HISTORIAL'}
                {versions.length > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${showHistory ? 'bg-white/20' : 'bg-slate-100'}`}>{versions.length}</span>}
              </button>
            )}
            <button onClick={onClose} className="p-3.5 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-300 transition-all">
              <ICONS.XCircle size={28} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Main Form Content */}
          <div className={`flex-1 overflow-y-auto p-8 transition-all duration-500 ${showHistory ? 'opacity-50 blur-[2px] pointer-events-none translate-x-[-20px]' : ''}`}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Columna Izquierda: Metadatos */}
              <div className="lg:col-span-4 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificador del Prompt</label>
                  <input 
                    type="text"
                    value={form.titulo}
                    onChange={e => setForm({ ...form, titulo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-slate-700 placeholder:text-slate-300"
                    placeholder="Ej: Asistente SEO Avanzado"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contexto Operativo</label>
                  <select 
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-slate-700 cursor-pointer"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Quality Widget */}
                <div className="bg-indigo-50/50 rounded-[2rem] p-6 border border-indigo-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Score de Calidad IA</span>
                    {form.calidad_score ? (
                      <span className={`px-3 py-1 rounded-full text-white font-black text-xs ${form.calidad_score > 7 ? 'bg-emerald-500' : 'bg-amber-500'} shadow-md animate-bounce-in`}>
                        {form.calidad_score}/10
                      </span>
                    ) : null}
                  </div>
                  
                  {form.calidad_feedback ? (
                    <div className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border border-indigo-100/50 shadow-sm relative group">
                       <ICONS.BookOpen size={14} className="absolute top-3 right-3 text-indigo-200" />
                       <p className="text-xs font-bold text-indigo-900 leading-relaxed italic pr-4">
                        "{form.calidad_feedback}"
                      </p>
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium text-center py-2 bg-slate-100/50 rounded-xl border border-dashed border-slate-200">Sin auditoría de calidad activa.</p>
                  )}

                  <button 
                    onClick={handleAnalyzeQuality}
                    disabled={isAnalyzing || !form.contenido}
                    className="w-full bg-white text-indigo-600 border border-indigo-200 font-black py-3.5 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all text-xs flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-95"
                  >
                    {isAnalyzing ? <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /> : <ICONS.Zap size={14} />}
                    {isAnalyzing ? 'AUDITANDO...' : 'AUDITAR CON GEMINI'}
                  </button>
                </div>

                {variables.length > 0 && (
                  <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 animate-fade-in">
                    {/* Fixed: Use literal string for {{v}} text to avoid object interpretation in JSX */}
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Parámetros Dinámicos ({"{{v}}"})</span>
                    <div className="flex flex-wrap gap-2">
                      {variables.map(v => (
                        <span key={v} className="bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-[10px] font-black text-indigo-600 shadow-sm flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></div>
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Editor */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="flex-1 flex flex-col h-full min-h-[450px]">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido Maestro</label>
                       {form.tono && <span className="text-[10px] font-black bg-violet-100 text-violet-600 px-3 py-1 rounded-full uppercase shadow-sm">Tono: {form.tono}</span>}
                    </div>
                    <button 
                      onClick={handleImproveContent}
                      disabled={isImproving || !form.contenido}
                      className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white px-5 py-2.5 rounded-xl border-2 border-indigo-100 transition-all disabled:opacity-50 group active:scale-95"
                    >
                      <ICONS.Sparkles size={14} className={`${isImproving ? 'animate-pulse' : 'group-hover:scale-125'} transition-transform`} />
                      {isImproving ? 'PERFECCIONANDO...' : 'REFINAR CON IA'}
                    </button>
                  </div>
                  <div className="relative flex-1 rounded-[2.5rem] bg-slate-900 p-1 group">
                    <div className="absolute top-6 left-6 text-slate-700 pointer-events-none select-none font-mono text-xs opacity-50">PROMPT_EDITOR v2.0</div>
                    <textarea 
                      value={form.contenido}
                      onChange={e => setForm({ ...form, contenido: e.target.value })}
                      className="w-full h-full bg-transparent rounded-[2.4rem] p-10 pt-14 focus:outline-none transition-all font-mono text-sm leading-relaxed text-indigo-50 placeholder:text-slate-700 resize-none"
                      placeholder="Construye tu lógica aquí. Usa {{variable}} para crear campos interactivos..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar de Historial */}
          {showHistory && (
            <div className="w-96 border-l border-slate-100 bg-slate-50/80 backdrop-blur-md p-8 overflow-y-auto animate-fade-in flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
                  <ICONS.Clock className="text-indigo-600" size={18} />
                  Versiones Anteriores
                </h3>
              </div>

              {versions.length > 0 ? (
                <div className="space-y-6 flex-1">
                  {versions.map((v, index) => (
                    <div key={v.id} className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                          #{versions.length - index}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 italic">
                          {new Date(v.creado_en).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 mb-2 truncate pr-6">{v.titulo}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-3 font-mono leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                        {v.contenido}
                      </p>
                      <button 
                        onClick={() => revertToVersion(v)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-indigo-600 hover:text-white text-indigo-600 rounded-xl font-black text-[10px] transition-all border border-indigo-100 group/btn"
                      >
                        <ICONS.RotateCcw size={12} className="group-hover/btn:rotate-[-45deg] transition-transform" />
                        RESTAURAR ESTA VERSIÓN
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-200 mb-4 border-2 border-dashed border-slate-200">
                    <ICONS.Clock size={32} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">No hay historial disponible para este activo.</p>
                  <p className="text-[10px] text-slate-300 mt-2 font-medium">Las versiones se crean automáticamente al guardar cambios significativos.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button 
            onClick={() => setForm({ ...form, es_favorito: !form.es_favorito })}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-xs transition-all active:scale-95 ${form.es_favorito ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-100'}`}
          >
            <ICONS.Star size={18} fill={form.es_favorito ? 'currentColor' : 'none'} />
            {form.es_favorito ? 'DESTACADO' : 'DESTACAR'}
          </button>
          
          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-8 py-4 rounded-2xl border border-slate-200 font-black text-xs text-slate-500 hover:bg-white transition-all active:scale-95"
            >
              CANCELAR
            </button>
            <button 
              onClick={() => onSave(form)}
              className="px-10 py-4 rounded-2xl bg-slate-900 text-white font-black text-xs hover:bg-indigo-600 transition-all shadow-[0_20px_40px_-12px_rgba(79,70,229,0.3)] active:scale-95 flex items-center gap-3"
            >
              <ICONS.CheckCircle size={18} />
              SINCRONIZAR CAMBIOS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
