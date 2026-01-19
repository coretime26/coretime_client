import "./globals.css";
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { ColorSchemeScript, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { theme } from '../theme';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { MemberProvider } from '@/context/MemberContext';
import { FinanceProvider } from '@/context/FinanceContext';

export const metadata = {
  title: 'CoreTime - Pilates Studio Management',
  description: 'Smart studio management for owners and instructors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        <link rel="stylesheet" as="style" crossOrigin="anonymous" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          <ModalsProvider>
            <AuthProvider>
              <SettingsProvider>
                <FinanceProvider>
                  <MemberProvider>
                    {children}
                  </MemberProvider>
                </FinanceProvider>
              </SettingsProvider>
            </AuthProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}
