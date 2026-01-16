
import React from 'react';
import { Prompt } from '../types';
import { ICONS, DEFAULT_CATEGORIES } from '../constants';

interface PromptCardProps {
  prompt: Prompt;
  onEdit: (p: Prompt) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (p: Prompt) => void;
  onCopy: (content: string) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onEdit, onDelete, onToggleFavorite, onCopy }) => {
  const categoryColor = DEFAULT_CATEGORIES.find(c => c.nombre === prompt.categoria)?.color || '#94a3b8';
  
  const formattedDate = new Intl.DateTimeFormat('es-ES', { 
    day: 'numeric', 
    month: 'short'
  }).format(new Date(prompt.creado_en));

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-7 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] hover:border-indigo-200 transition-all duration-500 group flex flex-col h-full relative overflow-hidden">
      <div className="flex items-start justify-between mb-5">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span 
              className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest"
              style={{ backgroundColor: `${categoryColor}15`, color: categoryColor }}
            >
              {prompt.categoria || 'Sin Categoría'}
            </span>
            {prompt.calidad_score ? (
              <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black text-white ${prompt.calidad_score > 7 ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                {prompt.calidad_score}/10
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-300 uppercase tracking-tighter">
             <ICONS.CheckCircle size={10} className="text-emerald-400" />
             ACTUALIZADO {formattedDate}
          </div>
        </div>
        <button 
          onClick={() => onToggleFavorite(prompt)}
          className={`p-2.5 rounded-2xl transition-all ${prompt.es_favorito ? 'text-amber-500 bg-amber-50 shadow-inner scale-110' : 'text-slate-200 hover:text-slate-400 hover:bg-slate-50'}`}
        >
          <ICONS.Star size={20} fill={prompt.es_favorito ? 'currentColor' : 'none'} />
        </button>
      </div>

      <h3 className="text-xl font-black text-slate-900 mb-2 line-clamp-1 group-hover:text-indigo-600 transition-colors tracking-tight">
        {prompt.titulo}
      </h3>
      
      {prompt.tono && (
        <span className="text-[9px] font-bold text-indigo-400 mb-3 block">Tono detectado: {prompt.tono}</span>
      )}

      <p className="text-slate-500 text-sm mb-8 line-clamp-3 flex-grow leading-relaxed font-medium">
        {prompt.descripcion || prompt.contenido}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-8">
        {prompt.etiquetas.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="text-[9px] font-black bg-slate-50 text-slate-400 border border-slate-100 px-2.5 py-1 rounded-lg">
            #{tag.toUpperCase()}
          </span>
        ))}
        {prompt.etiquetas.length > 3 && <span className="text-[9px] font-black text-slate-300">+{prompt.etiquetas.length - 3}</span>}
      </div>

      <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button 
            onClick={() => onEdit(prompt)}
            className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
            title="Editar Prompt"
          >
            <ICONS.Edit3 size={20} />
          </button>
          <button 
            onClick={() => onDelete(prompt.id)}
            className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
            title="Eliminar de la Bóveda"
          >
            <ICONS.Trash2 size={20} />
          </button>
        </div>
        <button 
          onClick={() => onCopy(prompt.contenido)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black rounded-2xl hover:bg-indigo-600 transition-all shadow-xl active:scale-95 group/btn"
        >
          <ICONS.Copy size={14} className="group-hover/btn:rotate-12 transition-transform" />
          COPIAR
        </button>
      </div>
    </div>
  );
};

export default PromptCard;
