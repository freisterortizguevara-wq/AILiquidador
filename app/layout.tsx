import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from './components/Navbar';
import { ThemeProvider } from './components/ThemeProvider';

export const metadata: Metadata = {
  title: 'Sistema de Incapacidades',
  description: 'Gestión y liquidación de incapacidades laborales',
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f5f7' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

const systemFont =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* Script inline: aplica el tema ANTES de pintar para evitar flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var theme = stored || (prefersDark ? 'dark' : 'light');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      
      <body
  style={{ fontFamily: systemFont }}
  className="
    relative min-h-screen antialiased
    bg-[#f5f5f7] text-[#1d1d1f]
    dark:bg-[#0a1428] dark:text-[#e8eefc]
    selection:bg-[#0071e3]/25
    [text-rendering:optimizeLegibility]
    [-webkit-tap-highlight-color:transparent]
    transition-colors duration-300
  "
>
        {/* Resplandor sutil de fondo: da profundidad para que el vidrio del Navbar tenga algo que desenfocar */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
          <div className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[#0071e3]/[0.07] blur-3xl dark:bg-[#0a84ff]/[0.12]" />
          <div className="absolute top-1/3 -right-40 h-[420px] w-[420px] rounded-full bg-[#bf5af2]/[0.05] blur-3xl dark:bg-[#bf5af2]/[0.09]" />
        </div>

        <ThemeProvider>
          <Navbar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}