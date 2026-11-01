import "../index.css";
import localFont from "next/font/local";
import { AuthProvider } from "../components/AuthProvider";

// Variable fonts (latin subset) bundled locally so builds don't depend on Google Fonts.
const geistSans = localFont({
  src: "./fonts/geist-latin.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
});

const sourceSerif = localFont({
  src: "./fonts/source-serif-4-latin.woff2",
  weight: "200 900",
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  title: "Adnex | AI Ad Decisioning",
  description: "Score ad copy, get direct response feedback, and compare variants before spending media budget.",
  metadataBase: new URL("https://getadnex.com"),
};

// Runs before paint so the stored or system theme applies without a flash.
const themeScript =
  "try{var s=localStorage.getItem('adnex:theme');var t=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='light'}";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${sourceSerif.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
