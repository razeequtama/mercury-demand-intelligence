'use client';

import { useLanguage } from '../../i18n/LanguageProvider';

export default function LanguageSwitcher({ theme }) {
  const { locale, setLocale, t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <div
      aria-label={t('common.language')}
      className="flex items-center gap-0.5"
      role="group"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        aria-label={`${t('common.english')} (EN)`}
        className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-sm font-semibold transition cursor-pointer ${
          locale === 'en'
            ? isDark
              ? 'bg-[#d97706] text-white shadow-sm'
              : 'bg-[#c2410c] text-white shadow-sm'
            : isDark
              ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.04]'
              : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.03]'
        }`}
      >
        <span aria-hidden="true" className="text-sm">
          🇬🇧
        </span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('id')}
        aria-pressed={locale === 'id'}
        aria-label={`${t('common.indonesian')} (ID)`}
        className={`flex items-center gap-1 px-2.5 py-2 rounded-md text-sm font-semibold transition cursor-pointer ${
          locale === 'id'
            ? isDark
              ? 'bg-[#d97706] text-white shadow-sm'
              : 'bg-[#c2410c] text-white shadow-sm'
            : isDark
              ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.04]'
              : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.03]'
        }`}
      >
        <span aria-hidden="true" className="text-sm">
          🇮🇩
        </span>
        <span>ID</span>
      </button>
    </div>
  );
}