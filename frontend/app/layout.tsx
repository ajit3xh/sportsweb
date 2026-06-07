import type { Metadata } from "next";
import { Playfair_Display, Manrope } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Kathua Indoor Stadium — Premier Sports Complex",
  description:
    "The official management portal for Kathua Indoor Stadium. Book world-class sports facilities — Badminton, Table Tennis, Shooting, Judo and more. Managed under J&K Sports Authority.",
  keywords: [
    "Kathua Indoor Stadium",
    "sports booking J&K",
    "indoor stadium Kathua",
    "badminton court booking",
    "sports facility management",
    "J&K sports authority",
    "GovSports",
  ],
  openGraph: {
    title: "Kathua Indoor Stadium — Premier Sports Complex",
    description: "Professional sports facilities. Digital access. A legacy built for Kathua's future.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${playfair.variable} ${manrope.variable} antialiased`}
        style={{ background: "#0B0B0A", color: "#F7F4EF" }}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
