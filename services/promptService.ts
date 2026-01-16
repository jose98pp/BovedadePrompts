
import { Prompt, Categoria, PromptVersion } from '../types';
import { supabase } from './supabaseClient';

export const promptService = {
  getPrompts: async (): Promise<Prompt[]> => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('creado_en', { ascending: false });

      if (error) {
        throw new Error(`Error de base de datos: ${error.message}`);
      }
      return data || [];
    } catch (err: any) {
      console.error('Error fetching prompts:', err.message || err);
      throw err;
    }
  },

  getPromptVersions: async (promptId: string): Promise<PromptVersion[]> => {
    try {
      const { data, error } = await supabase
        .from('prompt_versions')
        .select('*')
        .eq('prompt_id', promptId)
        .order('creado_en', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching versions:', err);
      return [];
    }
  },

  savePrompt: async (prompt: Partial<Prompt>): Promise<Prompt> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      throw new Error("Sesión no válida o expirada. Por favor, inicia sesión de nuevo.");
    }

    const user = session.user;
    const now = new Date().toISOString();

    if (prompt.id) {
      // 1. Obtener el estado actual antes de actualizar para crear una versión si el contenido cambió
      const { data: currentPrompt } = await supabase
        .from('prompts')
        .select('titulo, contenido')
        .eq('id', prompt.id)
        .single();

      if (currentPrompt && currentPrompt.contenido !== prompt.contenido) {
        await supabase.from('prompt_versions').insert([{
          prompt_id: prompt.id,
          titulo: currentPrompt.titulo,
          contenido: currentPrompt.contenido
        }]);
      }

      // 2. Actualizar el prompt
      const { data, error } = await supabase
        .from('prompts')
        .update({ 
          titulo: prompt.titulo,
          contenido: prompt.contenido,
          descripcion: prompt.descripcion,
          categoria: prompt.categoria,
          etiquetas: prompt.etiquetas,
          es_favorito: prompt.es_favorito,
          calidad_score: prompt.calidad_score,
          calidad_feedback: prompt.calidad_feedback,
          tono: prompt.tono,
          actualizado_en: now 
        })
        .eq('id', prompt.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('prompts')
        .insert([{
          user_id: user.id,
          titulo: prompt.titulo || 'Sin título',
          contenido: prompt.contenido || '',
          descripcion: prompt.descripcion || '',
          categoria: prompt.categoria || 'Sin Categoría',
          etiquetas: prompt.etiquetas || [],
          es_favorito: prompt.es_favorito || false,
          calidad_score: prompt.calidad_score || 0,
          calidad_feedback: prompt.calidad_feedback || '',
          tono: prompt.tono || ''
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  deletePrompt: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('prompts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  getCategories: async (): Promise<Categoria[]> => {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Error fetching categories:', err.message || err);
      return [];
    }
  },

  saveCategory: async (nombre: string, color: string): Promise<Categoria> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) throw new Error("Debes estar autenticado para crear categorías.");

    const { data, error } = await supabase
      .from('categorias')
      .insert([{
        user_id: session.user.id,
        nombre,
        color
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
