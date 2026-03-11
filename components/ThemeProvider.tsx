'use client';

/**
 * 主题提供者包装器
 */

import { ThemeProvider } from '@/lib/theme-context';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
