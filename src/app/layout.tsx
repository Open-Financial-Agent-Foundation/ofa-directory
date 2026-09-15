import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE, siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({
	subsets: ["latin", "latin-ext"],
	weight: ["400", "500", "600"],
	variable: "--font-inter",
	display: "swap",
});
const geistMono = Geist_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-geist-mono",
	display: "swap",
});
export const metadata: Metadata = {
	metadataBase: new URL(siteUrl()),
	title: { default: SITE.name, template: `%s · ${SITE.name}` },
	description: SITE.tagline,
	alternates: { types: { "application/json": "/.well-known/ai-catalog.json" } },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className={`${inter.variable} ${geistMono.variable}`}>
			<head>
				<link rel="ai-catalog" href="/.well-known/ai-catalog.json" />
			</head>
			<body className="min-h-screen flex flex-col">
				<SiteHeader />
				<main className="flex-1 w-full max-w-[1120px] mx-auto px-6">{children}</main>
				<SiteFooter />
			</body>
		</html>
	);
}
