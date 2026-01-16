
import { createClient } from '@supabase/supabase-js';

/**
 * URL derivada de la URI proporcionada: postgresql://postgres:Jos63588702@db.ciszajexxtuokatkgoku.supabase.co:5432/postgres
 * Project ID: ciszajexxtuokatkgoku
 */
const supabaseUrl = 'https://ciszajexxtuokatkgoku.supabase.co'; 
// Nota: La clave anon debe corresponder al proyecto ciszajexxtuokatkgoku. 
// Si ves errores 401/403, asegúrate de actualizar esta clave desde el panel de Supabase > Settings > API.
const supabaseKey = 'sb_publishable_hhqCepG0EhiR4Sjxq0zDSg_x-A8VHbi'; 

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'boveda-prompts' }
  }
});
