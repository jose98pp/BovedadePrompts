
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { geminiService } from '../services/geminiService';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerated: (titulo: string, contenido: string) => void;
}

const IdeaModal: React.FC<IdeaModalProps> = ({ isOpen, onClose, onGenerated }) => {
  const [idea, setIdea] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setIsGenerating(true);
    try {
      const result = await geminiService.generarDesdeIdea(idea);
      onGenerated(result.titulo, result.contenido);
      setIdea('');
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
            <ICONS.Sparkles size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Generar desde idea</h2>
            <p className="text-sm text-slate-500">Deja que la IA cree el prompt por ti</p>
          </div>
        </div>

        <textarea 
          value={idea}
          onChange={e => setIdea(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 h-40 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none mb-6"
          placeholder="Ej: Necesito un prompt para que una IA actúe como un experto en SEO y me ayude a optimizar un blog sobre cocina vegana..."
        />

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>
          <button 
            disabled={isGenerating || !idea.trim()}
            onClick={handleGenerate}
            className="flex-2 px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <ICONS.Zap size={18} />
                Crear Prompt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IdeaModal;
