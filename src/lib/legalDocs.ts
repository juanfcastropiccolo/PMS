import fs from 'node:fs';
import path from 'node:path';

/**
 * Helper para leer los documentos legales desde el filesystem en build/runtime
 * de un Server Component de Next App Router. Los .md son la single source of
 * truth y se sincronizan con los del repo parkit_app (cliente Flutter usa los
 * mismos archivos para mostrarlos in-app).
 */

export type LegalSlug = 'privacidad' | 'terminos';

const TITLES: Record<LegalSlug, { title: string; lastUpdated: string }> = {
  privacidad: {
    title: 'Política de Privacidad',
    lastUpdated: '12 de mayo de 2026',
  },
  terminos: {
    title: 'Términos y Condiciones',
    lastUpdated: '12 de mayo de 2026',
  },
};

export function getLegalDocMeta(slug: LegalSlug) {
  return TITLES[slug];
}

export function readLegalDoc(slug: LegalSlug): string {
  const filePath = path.join(process.cwd(), 'legal', `${slug}.md`);
  return fs.readFileSync(filePath, 'utf-8');
}
