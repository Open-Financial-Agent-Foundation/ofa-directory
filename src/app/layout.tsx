import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SITE, siteUrl } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
	subsets: ["latin"],
	weight: ["500", "600", "700"],
	variable: "--font-archivo",
	display: "swap",
});
const plexSans = IBM_Plex_Sans({
	subsets: ["latin", "latin-ext"],
	weight: ["400", "500", "600"],
	variable: "--font-plex-sans",
	display: "swap",
});
const plexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500"],
	variable: "--font-plex-mono",
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
		<html lang="en" className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable}`}>
			<head>
				<link rel="ai-catalog" href="/.well-known/ai-catalog.json" />
			</head>
			<body className="min-h-screen flex flex-col">
				<SiteHeader />
				<main className="flex-1 w-full max-w-[1040px] mx-auto px-4 sm:px-6">{children}</main>
				<SiteFooter />
			</body>
		</html>
	);
}
