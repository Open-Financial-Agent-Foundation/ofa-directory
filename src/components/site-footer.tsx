import { SITE } from "@/lib/site";

export function SiteFooter() {
	return (
		<footer className="border-t border-rule mt-24">
			<div className="max-w-[1040px] mx-auto px-4 sm:px-6 py-8 flex flex-wrap gap-x-8 gap-y-2 justify-between text-[13px] text-muted">
				<span>
					{SITE.name} is an open registry conforming to Agentic Resource Discovery (
					{SITE.specVersion}). Code and registry under Apache-2.0.
				</span>
				<span className="mono">
					<a href="/.well-known/ai-catalog.json" className="hover:text-ink">
						/.well-known/ai-catalog.json
					</a>
					{" · "}
					<a href="/llms.txt" className="hover:text-ink">
						/llms.txt
					</a>
				</span>
			</div>
		</footer>
	);
}
