import Link from "next/link";
import { SITE } from "@/lib/site";

const NAV = [
	{ href: "/", label: "Index" },
	{ href: "/docs", label: "Docs" },
	{ href: "/submit", label: "Submit" },
	{ href: SITE.repo, label: "GitHub" },
];

export function SiteHeader() {
	return (
		<header className="sticky top-0 z-20 border-b border-rule bg-paper">
			<div className="max-w-[1120px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
				<Link href="/" className="flex items-center gap-2.5 text-ink">
					<span
						aria-hidden="true"
						className="inline-block w-[18px] h-[18px] rounded-[5px] bg-ink relative"
					>
						<span className="absolute inset-[4px] rounded-full border-[1.5px] border-paper" />
					</span>
					<span className="font-medium text-[15px] tracking-[-0.01em] hidden min-[420px]:inline">
						Open Financial Agent
					</span>
				</Link>
				<nav aria-label="Main" className="flex items-center gap-5 sm:gap-7 text-[14px]">
					{NAV.map((n) => (
						<Link
							key={n.href}
							href={n.href}
							className="text-muted hover:text-ink transition-colors duration-150"
						>
							{n.label}
						</Link>
					))}
				</nav>
			</div>
		</header>
	);
}
