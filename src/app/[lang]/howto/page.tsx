import { useI18n } from '../../../frontend/context/I18nContext';

export default function HowtoPage() {
  const { t } = useI18n();
  return (
    <main className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">{t('howto')}</h1>
      {/* ... howto content ... */}
    </main>
  );
}
