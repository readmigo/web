'use client';

const translations = {
  zh: {
    title: '应用发生严重错误',
    description: '非常抱歉，应用遇到了无法恢复的错误。请尝试重新加载页面。',
    reload: '重新加载',
  },
  en: {
    title: 'Critical Error',
    description: "We're sorry, the app encountered an unrecoverable error. Please try reloading the page.",
    reload: 'Reload',
  },
} as const;

function getLocale(): 'zh' | 'en' {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/NEXT_LOCALE=(\w+)/);
    if (match && (match[1] === 'en' || match[1] === 'zh')) {
      return match[1];
    }
  }
  return 'zh';
}

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = getLocale();
  const t = translations[locale];

  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'}>
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          backgroundColor: '#ffffff',
          color: '#1a1a2e',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '400px', padding: '24px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              borderRadius: '50%',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth={1.5}
              stroke="#ef4444"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '8px',
            }}
          >
            {t.title}
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}
          >
            {t.description}
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: 500,
              color: '#ffffff',
              backgroundColor: '#7c3aed',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {t.reload}
          </button>
        </div>
      </body>
    </html>
  );
}
