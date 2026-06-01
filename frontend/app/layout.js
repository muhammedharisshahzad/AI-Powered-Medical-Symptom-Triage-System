import "./globals.css";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex"
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-grotesk"
});

export const metadata = {
  title: "Medical Symptom Triage",
  description: "Agentic AI workflow for symptom triage"
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${plex.variable} ${grotesk.variable}`}>
      <head>
        <link rel="preload" as="image" href="/api/logo" />
      </head>
      <body className="app-body">
        <div className="shell">{children}</div>
      </body>
    </html>
  );
}
