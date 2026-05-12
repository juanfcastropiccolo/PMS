import type { Metadata } from 'next';
import LegalDocPage from '@/components/legal/LegalDocPage';
import { getLegalDocMeta, readLegalDoc } from '@/lib/legalDocs';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Parkit',
  description:
    'Términos y Condiciones de uso de Parkit. Reglas del marketplace de estacionamientos, reservas, pagos, cancelaciones y reembolsos.',
};

export default function TerminosPage() {
  const meta = getLegalDocMeta('terminos');
  const content = readLegalDoc('terminos');
  return (
    <LegalDocPage
      title={meta.title}
      lastUpdated={meta.lastUpdated}
      content={content}
    />
  );
}
