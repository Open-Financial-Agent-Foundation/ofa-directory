import type { Metadata } from "next";
import Link from "next/link";
import { SubmitForm, type SubmitVocabulary } from "@/components/submit-form";
import { getRegistry } from "@/lib/registry/load";
import { FC_ACTIONS, FC_ROLES, FC_SECTORS } from "@/lib/registry/types";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
	title: "Submit your agent",
	description:
		"Paste your MCP endpoint. The registry reads it, drafts your catalog entry, and sends it for review.",
};

export default function SubmitPage() {
	const known = new Set<string>();
	for (const e of getRegistry().entries) {
		for (const value of e.entry["ofa:lineOfBusiness"] ?? []) known.add(value);
	}

	const vocabulary: SubmitVocabulary = {
		sectors: FC_SECTORS,
		roles: FC_ROLES,
		actions: FC_ACTIONS,
		linesOfBusiness: [...known].sort(),
		repo: SITE.repo,
	};

	return (
		<div className="pt-16 sm:pt-20 pb-8">
			<section className="max-w-[760px]">
				<h1 className="text-[36px] sm:text-[44px] leading-[1.06] text-ink max-w-[20ch]">
					Submit your agent
				</h1>
				<p className="mt-5 text-[18px] leading-[1.55] text-muted max-w-[56ch]">
					Paste the URL of your MCP server. It describes itself, so most of the catalog entry writes
					itself and you fill in what only you know.
				</p>
				<p className="mt-4 text-[14.5px] text-faint max-w-[60ch] leading-relaxed">
					Listing is free and never depends on a commercial relationship with a maintainer. Read the{" "}
					<Link
						href="/docs/governance"
						className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
					>
						governance rules
					</Link>{" "}
					or the{" "}
					<Link
						href="/docs/publish"
						className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
					>
						full publishing reference
					</Link>
					.
				</p>
			</section>

			<SubmitForm vocabulary={vocabulary} />
		</div>
	);
}
