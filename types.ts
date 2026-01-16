
export interface Prompt {
  id: string;
  user_id: string;
  titulo: string;
  contenido: string;
  descripcion?: string;
  categoria?: string;
  etiquetas: string[];
  es_favorito: boolean;
  creado_en: string;
  actualizado_en: string;
  calidad_score?: number;
  calidad_feedback?: string;
  tono?: string;
}

export interface PromptVersion {
  id: string;
  prompt_id: string;
  titulo: string;
  contenido: string;
  creado_en: string;
}

export interface Categoria {
  id: string;
  user_id: string;
  nombre: string;
  color: string;
  creado_en: string;
}

export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
}

export enum ViewMode {
  LIST = 'list',
  GRID = 'grid'
}

export type ExportFormat = 'json' | 'csv' | 'md';
