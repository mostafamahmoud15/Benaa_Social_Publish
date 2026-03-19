import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import QueryProvider from "../../QueryProvider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

/**
 * Load Montserrat font with selected weights
 */
const montserratSans = Montserrat({
  weight: ["200", "300", "400", "500", "600", "700"],
  subsets: ["latin"],
});

/**
 * App metadata (SEO)
 */
export const metadata: Metadata = {
  title: "Social Publishing Dashboard",
  description: "Publish & manage content professionally",
};

/**
 * Root layout wrapper for the entire app
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={montserratSans.className}>

        {/* Theme provider (light / dark mode) */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

          {/* React Query provider */}
          <QueryProvider>

            {children}

            {/* Global toaster for notifications */}
            <Toaster richColors closeButton position="top-center" />

          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}