import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusPill } from "@/components/status-pill";
import { TypeMark } from "@/components/type-mark";
import { getRegistry } from "@/lib/registry/load";
import { KNOWN_TYPES } from "@/lib/registry/types";
import { SITE, siteUrl } from "@/lib/site";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const hit = getRegistry().byIdentifier.get(decodeURIComponent(id));
	return { title: hit ? hit.entry.displayName : "Entry" };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-6 gap-y-1 py-3 border-b border-rule">
			<dt className="label pt-1">{label}</dt>
			<dd className="text-[15px] min-w-0 break-words">{children}</dd>
		</div>
	);
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const identifier = decodeURIComponent(id);
	const hit = getRegistry().byIdentifier.get(identifier);
	if (!hit) notFound();
	const e = hit.entry;
	const isMcp = e.type === KNOWN_TYPES.mcpServer && e.url;
	const slug = e.identifier.split(":").pop() ?? "provider";
	const publicJson = { ...e };

	return (
		<article className="py-10 max-w-[820px]">
			<p className="mono text-[12px] text-muted">
				<Link href="/" className="hover:text-ink">
					Index
				</Link>
				{" / "}
				{hit.publisher}
			</p>
			<div className="flex flex-wrap items-center gap-3 mt-3">
				<h1 className="text-[32px] sm:text-[40px] font-semibold">{e.displayName}</h1>
				<StatusPill status={e["ofa:status"]} />
				<TypeMark type={e.type} />
			</div>
			<p className="mono text-[13px] text-muted mt-2 break-all">{e.identifier}</p>
			{e.description && <p className="mt-5 text-[17px] max-w-[62ch]">{e.description}</p>}

			{isMcp && (
				<section className="mt-8 bg-code rounded-xl p-5">
					<p className="label mb-3">Connect directly</p>
					<pre className="mono text-[12.5px] overflow-x-auto">
						<code>{`claude mcp add --transport http ${slug} ${e.url}`}</code>
					</pre>
					<p className="text-[13px] text-muted mt-3">
						Streamable HTTP,{" "}
						{typeof e.metadata?.auth === "string"
							? `auth: ${e.metadata.auth}`
							: "auth as the provider declares"}
						. Open Financial Agent only points here; the provider runs it.
					</p>
				</section>
			)}

			<dl className="mt-8 border-t border-rule">
				<Field label="Publisher">
					<span className="mono">{hit.publisher}</span> · {hit.host.displayName}
					{hit.host.documentationUrl && (
						<>
							{" · "}
							<a
								href={hit.host.documentationUrl}
								className="text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
								rel="noopener"
							>
								{hit.host.documentationUrl.replace(/^https?:\/\//, "")}
							</a>
						</>
					)}
				</Field>
				<Field label="Type">
					<span className="mono text-[13px]">{e.type}</span>
				</Field>
				{e.url && (
					<Field label="URL">
						<a
							href={e.url}
							className="mono text-[13px] text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink break-all"
							rel="noopener"
						>
							{e.url}
						</a>
					</Field>
				)}
				{e["ofa:sector"] && <Field label="Sector">{e["ofa:sector"].join(", ")}</Field>}
				{e["ofa:lineOfBusiness"] && (
					<Field label="Line of business">{e["ofa:lineOfBusiness"].join(", ")}</Field>
				)}
				{e["ofa:role"] && <Field label="Role">{e["ofa:role"].join(", ")}</Field>}
				{e["ofa:actions"] && <Field label="Actions">{e["ofa:actions"].join(", ")}</Field>}
				{e["ofa:country"] && <Field label="Country">{e["ofa:country"].join(", ")}</Field>}
				{e["ofa:languages"] && <Field label="Languages">{e["ofa:languages"].join(", ")}</Field>}
				{e["ofa:hostedBy"] && <Field label="Hosted by">{e["ofa:hostedBy"]}</Field>}
				{e.capabilities && e.capabilities.length > 0 && (
					<Field label="Capabilities">
						<ul className="flex flex-wrap gap-1.5">
							{e.capabilities.map((c) => (
								<li key={c} className="mono text-[12px] bg-code px-2 py-0.5 rounded-md">
									{c}
								</li>
							))}
						</ul>
					</Field>
				)}
				{e.representativeQueries && e.representativeQueries.length > 0 && (
					<Field label="Representative queries">
						<ul className="flex flex-col gap-1">
							{e.representativeQueries.map((q) => (
								<li key={q} className="before:content-['“'] after:content-['”'] text-muted">
									{q}
								</li>
							))}
						</ul>
					</Field>
				)}
				{e.tags && e.tags.length > 0 && (
					<Field label="Tags">
						<span className="mono text-[13px] text-muted">{e.tags.join(", ")}</span>
					</Field>
				)}
				<Field label="Source">
					<a
						href={`${SITE.repo}/blob/main/registry/${hit.sourceFile}`}
						className="mono text-[13px] text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
						rel="noopener"
					>
						registry/{hit.sourceFile}
					</a>
					{" · "}
					<a
						href={`${siteUrl()}/api/v1/entries/${encodeURIComponent(e.identifier)}`}
						className="mono text-[13px] text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
					>
						JSON
					</a>
				</Field>
			</dl>

			<details className="mt-8">
				<summary className="label cursor-pointer">Raw entry</summary>
				<pre className="mt-3 mono text-[12px] bg-code rounded-xl p-4 overflow-x-auto">
					<code>{JSON.stringify(publicJson, null, 2)}</code>
				</pre>
			</details>
		</article>
	);
}
