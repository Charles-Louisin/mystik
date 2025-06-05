import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Layout from "@/components/Layout";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Mystik - Dis ce que tu penses. Reste dans l'ombre.",
  description: "Plateforme de messagerie anonyme où vous pouvez envoyer et recevoir des messages mystérieux.",
  keywords: ["anonyme", "messagerie", "mystik", "secret", "message"],
  authors: [{ name: "Mystik" }],
  metadataBase: new URL("https://mystik.app"), // À remplacer par votre domaine réel
  themeColor: "#8a2be2",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} antialiased`}>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: "var(--card-bg)",
              color: "var(--foreground)",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            },
            duration: 3000,
          }}
        />
        <Layout>
        {children}
        </Layout>
      </body>
    </html>
  );
}
