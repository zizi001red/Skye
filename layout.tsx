import "./globals.css";
import { Barlow, Barlow_Condensed } from "next/font/google";
import Link from "next/link";

const body = Barlow({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-body" });
const display = Barlow_Condensed({ subsets: ["latin"], weight: ["600", "700"], variable: "--font-display" });

export const metadata = { title: "Sagar Fit", description: "Your plan for today." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>
        <main className="mx-auto max-w-md px-4 pb-24 pt-6">{children}</main>
        <nav className="fixed bottom-0 inset-x-0 border-t border-line bg-bg">
          <div className="mx-auto flex max-w-md justify-around py-3 text-sm">
            <Link href="/">Today</Link>
            <Link href="/workout">Workout</Link>
            <Link href="/food">Food</Link>
            <Link href="/progress">Progress</Link>
          </div>
        </nav>
      </body>
    </html>
  );
}
