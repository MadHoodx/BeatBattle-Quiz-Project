import { I18nProvider } from "@/context/I18nContext";
import type { Metadata } from "next";
import "@/styles/globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "SeoulTune Quiz",
  description: "K-Drama OST Quiz Game",
};

// Next.js 15+ dynamic routes: params must be awaited (async component)
export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return (
    <I18nProvider key={lang} lang={lang}>
      <ClientLayout>{children}</ClientLayout>
    </I18nProvider>
  );
}
