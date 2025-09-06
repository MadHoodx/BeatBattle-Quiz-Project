import { I18nProvider } from "../../frontend/context/I18nContext";
import type { Metadata } from "next";
import "../../frontend/styles/globals.css";
import ClientLayout from "../_components/ClientLayout";

export const metadata: Metadata = {
  title: "SeoulTune Quiz",
  description: "K-Drama OST Quiz Game",
};

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: { lang: string } }) {
  const { lang } = await params;
  return (
    <I18nProvider lang={lang}>
      <ClientLayout>{children}</ClientLayout>
    </I18nProvider>
  );
}
