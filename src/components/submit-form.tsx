"use client";

import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { buildCatalog, catalogPath, submissionSchema } from "@/lib/registry/build-catalog";

type Draft = {
	endpointHost: string;
	publisher: string;
	slug: string;
	displayName: string;
	identifier: string;
	url: string;
	version?: string;
	description: string;
	capabilities: string[];
	suggestedQueries: string[];
	suggestedActions: string[];
	tools: { name: string; title?: string; description?: string }[];
	instructions?: string;
};

export type SubmitVocabulary = {
	sectors: readonly string[];
	roles: readonly string[];
	actions: readonly string[];
	linesOfBusiness: string[];
	repo: string;
};

const field =
	"w-full bg-paper border border-rule-strong rounded-lg px-3.5 py-2.5 text-[15px] text-ink placeholder:text-faint focus:border-ink outline-none transition-[border-color] duration-150";

function list(value: string): string[] {
	return value
		.split(/[,\n]/)
		.map((v) => v.trim())
		.filter(Boolean);
}

function errorMessage(body: unknown, fallback: string): string {
	if (
		body &&
		typeof body === "object" &&
		"error" in body &&
		body.error &&
		typeof body.error === "object" &&
		"message" in body.error
	) {
		return String(body.error.message);
	}
	return fallback;
}

function Row({
	label,
	hint,
	htmlFor,
	children,
}: {
	label: string;
	hint?: string;
	htmlFor?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-8 gap-y-2 py-5 border-b border-rule">
			<div>
				<label htmlFor={htmlFor} className="text-[14px] font-medium text-ink">
					{label}
				</label>
				{hint && <p className="text-[13px] text-faint mt-1 leading-relaxed">{hint}</p>}
			</div>
			<div className="min-w-0">{children}</div>
		</div>
	);
}

export function SubmitForm({ vocabulary }: { vocabulary: SubmitVocabulary }) {
	const ids = {
		url: useId(),
		name: useId(),
		description: useId(),
		sector: useId(),
		lob: useId(),
		role: useId(),
		country: useId(),
		languages: useId(),
		queries: useId(),
		publisher: useId(),
	};

	const [url, setUrl] = useState("");
	const [reading, setReading] = useState(false);
	const [readError, setReadError] = useState<string | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);

	const [publisher, setPublisher] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [description, setDescription] = useState("");
	const [sector, setSector] = useState("");
	const [lob, setLob] = useState("");
	const [role, setRole] = useState("");
	const [country, setCountry] = useState("");
	const [languages, setLanguages] = useState("");
	const [actions, setActions] = useState<string[]>([]);
	const [queries, setQueries] = useState("");

	const [sending, setSending] = useState(false);
	const [sendError, setSendError] = useState<string | null>(null);
	const [opened, setOpened] = useState<{ url: string; number: number } | null>(null);
	const [copied, setCopied] = useState(false);

	async function read(event: React.FormEvent) {
		event.preventDefault();
		setReading(true);
		setReadError(null);
		setOpened(null);
		setSendError(null);
		try {
			const res = await fetch("/api/introspect", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ url: url.trim() }),
			});
			const body: unknown = await res.json();
			if (!res.ok) {
				setReadError(errorMessage(body, "Could not read that endpoint."));
				setDraft(null);
				return;
			}
			const next: Draft = body as Draft;
			setDraft(next);
			setPublisher(next.publisher);
			setDisplayName(next.displayName);
			setDescription(next.description);
			setActions(next.suggestedActions);
			setQueries(next.suggestedQueries.slice(0, 4).join("\n"));
		} catch (cause) {
			console.error("[ofa] introspect request failed", { cause });
			setReadError("The request did not complete. Check the URL and try again.");
		} finally {
			setReading(false);
		}
	}

	const queryLines = list(queries);
	const domain = publisher
		.trim()
		.toLowerCase()
		.replace(/^https?:\/\//, "")
		.replace(/^www\./, "")
		.replace(/\/.*$/, "");
	const domainValid = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain);
	const hostedElsewhere = draft !== null && domainValid && domain !== draft.endpointHost;
	const identifier = draft ? `urn:air:${domain || draft.endpointHost}:agent:${draft.slug}` : "";

	// Parsed through the same schema the route enforces, so the button enables on exactly the
	// conditions the server would accept and the preview is the file it would write.
	const submission = useMemo(() => {
		if (!draft || !domainValid) return null;
		const candidate = {
			url: draft.url,
			publisher: domain,
			displayName: displayName.trim(),
			description: description.trim(),
			sector,
			lineOfBusiness: list(lob),
			...(role ? { role } : {}),
			actions,
			country: list(country).map((c) => c.toUpperCase()),
			languages: list(languages),
			representativeQueries: queryLines,
		};
		const result = submissionSchema.safeParse(candidate);
		return result.success ? result.data : null;
	}, [
		draft,
		domainValid,
		domain,
		displayName,
		description,
		sector,
		lob,
		role,
		actions,
		country,
		languages,
		queryLines,
	]);

	const complete = submission !== null;

	// The same builder the server runs, so the file below is the file the pull request carries.
	const catalog = useMemo(() => {
		if (!draft || !submission) return "";
		return buildCatalog({
			submission,
			facts: {
				endpointHost: draft.endpointHost,
				slug: draft.slug,
				capabilities: draft.capabilities,
				...(draft.version ? { version: draft.version } : {}),
			},
			checkedAt: new Date().toISOString().slice(0, 10),
		});
	}, [draft, submission]);

	const path = domainValid ? catalogPath(domain) : "";

	async function send() {
		if (!submission) return;
		setSending(true);
		setSendError(null);
		try {
			const res = await fetch("/api/submit", {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify(submission),
			});
			const body: unknown = await res.json();
			if (!res.ok) {
				setSendError(errorMessage(body, "The submission did not go through."));
				return;
			}
			if (
				body &&
				typeof body === "object" &&
				"pullRequest" in body &&
				typeof body.pullRequest === "string"
			) {
				setOpened({
					url: body.pullRequest,
					number: "number" in body && typeof body.number === "number" ? body.number : 0,
				});
			}
		} catch (cause) {
			console.error("[ofa] submission failed", { cause });
			setSendError(
				"The submission did not complete. Try again, or copy the file and open a pull request by hand.",
			);
		} finally {
			setSending(false);
		}
	}

	async function copy() {
		try {
			await navigator.clipboard.writeText(catalog);
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch (cause) {
			console.error("[ofa] copy failed", { cause });
		}
	}

	return (
		<div className="max-w-[820px]">
			<form onSubmit={read} className="mt-10">
				<label htmlFor={ids.url} className="text-[14px] font-medium text-ink">
					Your MCP endpoint
				</label>
				<div className="flex flex-col sm:flex-row gap-3 mt-2">
					<input
						id={ids.url}
						type="url"
						required
						value={url}
						onChange={(e) => setUrl(e.target.value)}
						placeholder="https://agents.acme-seguros.es/mcp"
						spellCheck={false}
						className={`${field} h-12 sm:flex-1`}
					/>
					<button
						type="submit"
						disabled={reading || url.trim().length < 8}
						className="h-12 shrink-0 px-5 rounded-lg bg-ink text-paper text-[15px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity duration-150"
					>
						{reading ? "Reading…" : "Read the server"}
					</button>
				</div>
				<p className="text-[13px] text-faint mt-2.5">
					Streamable HTTP over HTTPS, reachable without a key. We call{" "}
					<span className="mono text-[12.5px]">initialize</span> and{" "}
					<span className="mono text-[12.5px]">tools/list</span>, nothing else.
				</p>
				{readError && (
					<p role="alert" className="text-[14px] text-ink mt-4 border-l border-rule-strong pl-4">
						{readError}
					</p>
				)}
			</form>

			{draft && (
				<>
					<section aria-labelledby="found" className="mt-14">
						<h2 id="found" className="text-[20px]">
							What the server says about itself
						</h2>
						<dl className="mt-5 border-t border-rule">
							<div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-8 py-3.5 border-b border-rule">
								<dt className="text-[14px] text-muted">Served from</dt>
								<dd className="mono text-[13px] text-ink">{draft.endpointHost}</dd>
							</div>
							{draft.version && (
								<div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-8 py-3.5 border-b border-rule">
									<dt className="text-[14px] text-muted">Version</dt>
									<dd className="mono text-[13px] text-ink">{draft.version}</dd>
								</div>
							)}
							<div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-x-8 py-3.5 border-b border-rule">
								<dt className="text-[14px] text-muted">Tools</dt>
								<dd className="flex flex-wrap gap-1.5">
									{draft.capabilities.map((c) => (
										<span
											key={c}
											className="mono text-[12px] bg-fill px-2 py-0.5 rounded-md text-ink"
										>
											{c}
										</span>
									))}
								</dd>
							</div>
						</dl>
					</section>

					<section aria-labelledby="describe" className="mt-14">
						<h2 id="describe" className="text-[20px]">
							What only you can say
						</h2>
						<p className="text-[15px] text-muted mt-2 max-w-[62ch] leading-relaxed">
							The rest is the part an endpoint cannot tell us. Representative queries matter most:
							they are what the index ranks against, so write them the way your customers ask.
						</p>

						<div className="mt-6 border-t border-rule">
							<Row
								label="Your domain"
								htmlFor={ids.publisher}
								hint="The domain you own. Every identifier is anchored to it, and a maintainer checks the claim."
							>
								<input
									id={ids.publisher}
									value={publisher}
									onChange={(e) => setPublisher(e.target.value)}
									className={field}
									spellCheck={false}
								/>
								<p className="mono text-[12.5px] text-faint mt-2 break-all">{identifier}</p>
								{hostedElsewhere && (
									<p className="text-[13px] text-muted mt-2 leading-relaxed">
										The endpoint runs on{" "}
										<span className="mono text-[12.5px]">{draft.endpointHost}</span>, so that is
										recorded as <span className="mono text-[12.5px]">ofa:hostedBy</span> and the
										entry stays yours.
									</p>
								)}
								{!domainValid && publisher.trim().length > 0 && (
									<p className="text-[13px] text-muted mt-2">That is not a domain name.</p>
								)}
							</Row>

							<Row label="Name" htmlFor={ids.name} hint="How it appears in the index.">
								<input
									id={ids.name}
									value={displayName}
									onChange={(e) => setDisplayName(e.target.value)}
									className={field}
								/>
							</Row>

							<Row
								label="Description"
								htmlFor={ids.description}
								hint="One or two sentences. What it does, where, for whom."
							>
								<textarea
									id={ids.description}
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									rows={4}
									className={`${field} resize-y leading-relaxed`}
								/>
							</Row>

							<Row label="Sector" htmlFor={ids.sector} hint="The regulated activity.">
								<select
									id={ids.sector}
									value={sector}
									onChange={(e) => setSector(e.target.value)}
									className={field}
								>
									<option value="">Choose one</option>
									{vocabulary.sectors.map((s) => (
										<option key={s} value={s}>
											{s}
										</option>
									))}
								</select>
							</Row>

							<Row
								label="Line of business"
								htmlFor={ids.lob}
								hint="Comma separated. Reuse an existing value where one fits."
							>
								<input
									id={ids.lob}
									value={lob}
									onChange={(e) => setLob(e.target.value)}
									list={`${ids.lob}-known`}
									placeholder="home, auto"
									className={field}
								/>
								<datalist id={`${ids.lob}-known`}>
									{vocabulary.linesOfBusiness.map((v) => (
										<option key={v} value={v} />
									))}
								</datalist>
							</Row>

							<Row
								label="Actions"
								hint="What an agent can get done. Checked from your tool names; correct them."
							>
								<div className="flex flex-wrap gap-x-5 gap-y-2.5">
									{vocabulary.actions.map((a) => (
										<label
											key={a}
											className="flex items-center gap-2 text-[14px] text-ink cursor-pointer"
										>
											<input
												type="checkbox"
												checked={actions.includes(a)}
												onChange={(e) =>
													setActions((prev) =>
														e.target.checked ? [...prev, a] : prev.filter((x) => x !== a),
													)
												}
												className="w-4 h-4"
											/>
											{a}
										</label>
									))}
								</div>
							</Row>

							<Row label="Role" htmlFor={ids.role} hint="Who you are in the value chain. Optional.">
								<select
									id={ids.role}
									value={role}
									onChange={(e) => setRole(e.target.value)}
									className={field}
								>
									<option value="">Not stated</option>
									{vocabulary.roles.map((r) => (
										<option key={r} value={r}>
											{r}
										</option>
									))}
								</select>
							</Row>

							<Row
								label="Country"
								htmlFor={ids.country}
								hint="ISO codes, comma separated. Leave empty if you sell by residency."
							>
								<input
									id={ids.country}
									value={country}
									onChange={(e) => setCountry(e.target.value)}
									placeholder="ES, FR"
									className={field}
								/>
							</Row>

							<Row label="Languages" htmlFor={ids.languages} hint="What the agent answers in.">
								<input
									id={ids.languages}
									value={languages}
									onChange={(e) => setLanguages(e.target.value)}
									placeholder="es, en"
									className={field}
								/>
							</Row>

							<Row
								label="Representative queries"
								htmlFor={ids.queries}
								hint="Two to five, one per line, in your customers' words and languages."
							>
								<textarea
									id={ids.queries}
									value={queries}
									onChange={(e) => setQueries(e.target.value)}
									rows={5}
									className={`${field} resize-y leading-relaxed`}
								/>
								<p className="text-[13px] text-faint mt-2">
									{queryLines.length} of 2 to 5{queryLines.length > 5 ? ". Trim to five." : ""}
								</p>
								{draft.suggestedQueries.length > 0 && (
									<div className="mt-3">
										<p className="text-[13px] text-faint mb-2">
											Drawn from your tool descriptions, as a starting point:
										</p>
										<div className="flex flex-wrap gap-2">
											{draft.suggestedQueries.map((s) => (
												<button
													key={s}
													type="button"
													onClick={() =>
														setQueries((prev) =>
															list(prev).includes(s) ? prev : `${prev.trimEnd()}\n${s}`.trim(),
														)
													}
													className="text-[13px] text-muted hover:text-ink bg-fill hover:bg-fill-hover rounded-full px-3 py-1.5 transition-colors duration-150 text-left"
												>
													{s}
												</button>
											))}
										</div>
									</div>
								)}
							</Row>
						</div>
					</section>

					<section aria-labelledby="send" className="mt-14">
						<h2 id="send" className="text-[20px]">
							Send it
						</h2>

						{opened ? (
							<div className="mt-5 border-t border-rule pt-6">
								<p className="text-[17px] text-ink">
									Pull request {opened.number > 0 ? `#${opened.number}` : ""} is open on the
									registry.
								</p>
								<p className="text-[15px] text-muted mt-2 max-w-[62ch] leading-relaxed">
									A maintainer checks that the endpoint answers and that the domain is yours, then
									merges it. You will see the review on the pull request itself. Nothing is listed
									in the index before that.
								</p>
								<a
									href={opened.url}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center h-11 px-5 mt-5 rounded-lg bg-ink text-paper text-[15px] font-medium hover:opacity-90 transition-opacity duration-150"
								>
									Follow the pull request
								</a>
							</div>
						) : (
							<>
								<p className="text-[15px] text-muted mt-2 max-w-[62ch] leading-relaxed">
									This opens a pull request on the registry carrying the file below, as{" "}
									<span className="mono text-[13px]">{path}</span>. You do not need a GitHub
									account. A maintainer reviews it, and nothing is listed before they merge.
								</p>

								<div className="flex flex-wrap items-center gap-3 mt-6">
									<button
										type="button"
										onClick={send}
										disabled={!complete || sending}
										className="h-11 px-5 rounded-lg bg-ink text-paper text-[15px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity duration-150"
									>
										{sending ? "Opening…" : "Open a pull request"}
									</button>
									{catalog && (
										<button
											type="button"
											onClick={copy}
											className="h-11 px-4 rounded-lg border border-rule-strong hover:border-ink text-[15px] text-ink transition-colors duration-150"
										>
											{copied ? "Copied" : "Copy the file"}
										</button>
									)}
									{!complete && (
										<span className="text-[13px] text-faint">
											Fill your domain, sector, line of business, an action and two queries first.
										</span>
									)}
								</div>

								{sendError && (
									<p
										role="alert"
										className="text-[14px] text-ink mt-5 border-l border-rule-strong pl-4 max-w-[62ch] leading-relaxed"
									>
										{sendError}{" "}
										<a
											href={`${vocabulary.repo}/issues/new?title=${encodeURIComponent(`Submission: ${domain}`)}`}
											target="_blank"
											rel="noopener noreferrer"
											className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
										>
											Open an issue instead
										</a>
										.
									</p>
								)}
							</>
						)}

						{catalog && (
							<pre className="mt-6 bg-fill rounded-lg p-5 overflow-x-auto mono text-[12.5px] leading-relaxed text-ink">
								<code>{catalog}</code>
							</pre>
						)}

						<p className="text-[13.5px] text-faint mt-4 max-w-[62ch] leading-relaxed">
							Prefer to keep it on your own domain? Host this file at{" "}
							<span className="mono text-[12.5px]">/.well-known/ai-catalog.json</span> and{" "}
							<Link
								href="/docs/publish"
								className="text-muted hover:text-ink underline underline-offset-[3px] decoration-rule-strong hover:decoration-ink"
							>
								add your domain to the crawler
							</Link>
							. That makes you discoverable by every ARD registry, not only this one.
						</p>
					</section>
				</>
			)}
		</div>
	);
}
