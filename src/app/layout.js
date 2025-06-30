import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Layout from "@/components/Layout";
import Script from "next/script";

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
  metadataBase: new URL("https://mystik-three.vercel.app"), // À remplacer par votre domaine réel
  manifest: "/manifest.json",
  icons: {
    icon: '/favicon.ico',
    apple: '/logo192.png',
  },
};

export const viewport = {
  themeColor: "#8a2be2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/logo192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
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
            duration: 2000,
          }}
        />
        <Layout>
        {children}
        </Layout>
        
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registration successful with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
