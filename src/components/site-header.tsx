import Link from "next/link";
import { SITE } from "@/lib/site";

const NAV = [
	{ href: "/", label: "Index" },
	{ href: "/docs", label: "Docs" },
	{ href: "/docs/publish", label: "Publish" },
	{ href: SITE.repo, label: "GitHub" },
];

export function SiteHeader() {
	return (
		<header className="border-b border-rule">
			<div className="max-w-[1040px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
				<Link href="/" className="flex items-baseline gap-3 no-underline">
					<span className="font-semibold text-[17px] tracking-tight text-ink">
						Open Financial Agent
					</span>
					<span className="label hidden sm:inline">v0 · {SITE.specVersion}</span>
				</Link>
				<nav className="flex items-center gap-5 text-[14px]">
					{NAV.map((n) => (
						<Link
							key={n.href}
							href={n.href}
							className="text-muted hover:text-ink transition-colors"
						>
							{n.label}
						</Link>
					))}
				</nav>
			</div>
		</header>
	);
}
