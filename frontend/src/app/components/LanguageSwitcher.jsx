'use client';

import { useLanguage } from '../../i18n/LanguageProvider';

export function EnglishLogo({ className = 'w-4 h-3', idPrefix = 'uk' }) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={`${className} shrink-0 rounded-[2px] overflow-hidden`}
      aria-hidden="true"
    >
      <clipPath id={`${idPrefix}-flag-clip-base`}>
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id={`${idPrefix}-flag-clip-diag`}>
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath={`url(#${idPrefix}-flag-clip-base)`}>
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#FFFFFF" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          clipPath={`url(#${idPrefix}-flag-clip-diag)`}
          stroke="#C8102E"
          strokeWidth="4"
        />
        <path d="M30,0 v30 M0,15 h60" stroke="#FFFFFF" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function IndonesianLogo({ className = 'w-4 h-3' }) {
  return (
    <svg
      viewBox="0 0 60 40"
      className={`${className} shrink-0 rounded-[2px] overflow-hidden`}
      aria-hidden="true"
    >
      <rect width="60" height="20" fill="#E70011" />
      <rect y="20" width="60" height="20" fill="#FFFFFF" />
    </svg>
  );
}

export default function LanguageSwitcher({ theme }) {
  const { locale, setLocale, t } = useLanguage();
  const isDark = theme === 'dark';

  return (
    <div
      aria-label={t('common.language')}
      className="flex items-center gap-1"
      role="group"
    >
      <button
        type="button"
        onClick={() => setLocale('en')}
        aria-pressed={locale === 'en'}
        aria-label={`${t('common.english')} (EN)`}
        className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-bold transition cursor-pointer ${
          locale === 'en'
            ? isDark
              ? 'bg-[#d97706] text-white shadow-sm'
              : 'bg-[#c2410c] text-white shadow-sm'
            : isDark
              ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.04]'
              : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.03]'
        }`}
      >
        <span className="flex items-center justify-center shrink-0 w-[18px] h-[13px] rounded-[2px] overflow-hidden border border-black/20 dark:border-white/20 shadow-xs">
          <EnglishLogo className="w-full h-full" />
        </span>
        <span>EN</span>
      </button>

      <button
        type="button"
        onClick={() => setLocale('id')}
        aria-pressed={locale === 'id'}
        aria-label={`${t('common.indonesian')} (ID)`}
        className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-bold transition cursor-pointer ${
          locale === 'id'
            ? isDark
              ? 'bg-[#d97706] text-white shadow-sm'
              : 'bg-[#c2410c] text-white shadow-sm'
            : isDark
              ? 'text-[#b8a394] hover:text-[#fff8f0] hover:bg-white/[0.04]'
              : 'text-[#6b5646] hover:text-[#241a14] hover:bg-black/[0.03]'
        }`}
      >
        <span className="flex items-center justify-center shrink-0 w-[18px] h-[13px] rounded-[2px] overflow-hidden border border-black/20 dark:border-white/20 shadow-xs">
          <IndonesianLogo className="w-full h-full" />
        </span>
        <span>ID</span>
      </button>
    </div>
  );
}