import "../index.css";
import localFont from "next/font/local";
import { AuthProvider } from "../components/AuthProvider";

const geistSans = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../../node_modules/next/dist/next-devtools/server/font/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata = {
  title: "Adnex | AI Ad Decisioning",
  description: "Score ad copy, get direct response feedback, and compare variants before spending media budget.",
  metadataBase: new URL("https://getadnex.com"),
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var s=localStorage.getItem('adnex:theme');var t=s==='light'||s==='dark'?s:(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.classList.toggle('dark',t==='dark');document.documentElement.classList.add(t+'-theme');document.body.classList.add(t+'-theme')}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.classList.add('dark','dark-theme');document.body.classList.add('dark-theme')}",
          }}
        />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
