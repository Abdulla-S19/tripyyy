import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Playfair_Display } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import { publicFeatures } from "@/lib/features";
import { themeBootScript } from "@/lib/theme-boot";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "TRIPYYY — Every road, already planned",
  description:
    "Tell TRIPYYY where you're going, who's coming and how you like to travel. Get a full hour-by-hour itinerary with buses, food stops, places and budget.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#070a12" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script sets data-theme / the "dark" class before hydration, hence suppressHydrationWarning.
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`dark ${inter.variable} ${playfair.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProviders features={publicFeatures()}>{children}</AppProviders>
      </body>
    </html>
  );
}
