import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import "leaflet/dist/leaflet.css";

const syne = Syne({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-syne",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

export const metadata = {
  title: "AquaConnect Admin",
  description: "Water Utility Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable}`}>{children}</body>
    </html>
  );
}
