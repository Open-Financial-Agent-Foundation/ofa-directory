import Link from "next/link";
import { SITE } from "@/lib/site";

export function SiteFooter() {
	return (
		<footer className="border-t border-rule mt-32">
			<div className="max-w-[1120px] mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-8 text-[13.5px] text-muted">
				<div className="max-w-[52ch] leading-relaxed">
					<p className="text-ink font-medium mb-1">Open Financial Agent</p>
					<p>
						An open registry conforming to Agentic Resource Discovery ({SITE.specVersion}). Code and
						registry under Apache-2.0. Relevance scores are never a measure of trust.
					</p>
				</div>
				<ul className="flex flex-col gap-2 sm:text-right">
					<li>
						<Link href="/docs" className="hover:text-ink transition-colors duration-150">
							Documentation
						</Link>
					</li>
					<li>
						<a href={SITE.repo} className="hover:text-ink transition-colors duration-150">
							GitHub
						</a>
					</li>
					<li>
						<a
							href="/.well-known/ai-catalog.json"
							className="mono text-[12.5px] hover:text-ink transition-colors duration-150"
						>
							/.well-known/ai-catalog.json
						</a>
					</li>
					<li>
						<a
							href="/llms.txt"
							className="mono text-[12.5px] hover:text-ink transition-colors duration-150"
						>
							/llms.txt
						</a>
					</li>
				</ul>
			</div>
		</footer>
	);
}
