import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DOC_PAGES, isDocSlug, renderDoc } from "@/lib/docs/load";
import { siteUrl } from "@/lib/site";

export function generateStaticParams() {
	return DOC_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug: string }>;
}): Promise<Metadata> {
	const { slug } = await params;
	const page = DOC_PAGES.find((p) => p.slug === slug);
	return { title: page ? page.title : "Docs" };
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	if (!isDocSlug(slug)) notFound();
	const { html } = await renderDoc(slug, { SITE_URL: siteUrl() });
	return (
		<div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-14 py-12">
			<nav aria-label="Docs" className="md:sticky md:top-6 self-start">
				<p className="label mb-3 text-faint">Documentation</p>
				<ul className="flex flex-col gap-1 text-[14px]">
					{DOC_PAGES.map((p) => (
						<li key={p.slug}>
							<Link
								href={`/docs/${p.slug}`}
								className={`block py-1 transition-colors duration-150 ${p.slug === slug ? "text-ink font-medium" : "text-muted hover:text-ink"}`}
								aria-current={p.slug === slug ? "page" : undefined}
							>
								{p.title}
							</Link>
						</li>
					))}
				</ul>
			</nav>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: the HTML comes from this repository's own docs/*.md, rendered server-side */}
			<article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
		</div>
	);
}
