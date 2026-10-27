"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// Light/dark admin theme. Toggles the `.dark` class on <html>, which the
// `dark` custom variant in globals.css keys off.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
