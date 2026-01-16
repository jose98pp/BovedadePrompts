
import { Prompt, ExportFormat } from '../types';

export const exportService = {
  exportPrompts: (prompts: Prompt[], format: ExportFormat) => {
    let content = '';
    let mimeType = '';
    let filename = `prompts_export_${new Date().toISOString().split('T')[0]}`;

    switch (format) {
      case 'json':
        content = JSON.stringify(prompts, null, 2);
        mimeType = 'application/json';
        filename += '.json';
        break;
      case 'csv':
        const headers = ['ID', 'Título', 'Contenido', 'Descripción', 'Categoría', 'Etiquetas', 'Favorito', 'Creado'];
        const rows = prompts.map(p => [
          p.id,
          `"${p.titulo.replace(/"/g, '""')}"`,
          `"${p.contenido.replace(/"/g, '""')}"`,
          `"${(p.descripcion || '').replace(/"/g, '""')}"`,
          p.categoria,
          `"${p.etiquetas.join(';')}"`,
          p.es_favorito ? 'Sí' : 'No',
          p.creado_en
        ]);
        content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        mimeType = 'text/csv';
        filename += '.csv';
        break;
      case 'md':
        content = prompts.map(p => `
# ${p.titulo}

${p.descripcion ? `*${p.descripcion}*\n` : ''}

\`\`\`
${p.contenido}
\`\`\`

**Categoría:** ${p.categoria || 'Sin Categoría'}
**Etiquetas:** ${p.etiquetas.join(', ') || 'Ninguna'}
**Favorito:** ${p.es_favorito ? 'Sí' : 'No'}
**Creado:** ${new Date(p.creado_en).toLocaleString()}

---
`).join('\n');
        mimeType = 'text/markdown';
        filename += '.md';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
