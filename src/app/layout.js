import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const geist = Geist({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "News Admin Dashboard",
  description: "Admin dashboard for managing news content",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}