import { apiError, json, preflight } from "@/lib/api/respond";
import {
	credentialsConfigured,
	GitHubRequestError,
	GitHubUnavailableError,
	openSubmissionPullRequest,
} from "@/lib/github/pull-request";
import { BlockedUrlError } from "@/lib/net/guarded-fetch";
import { buildCatalog, catalogPath, submissionSchema } from "@/lib/registry/build-catalog";
import { IntrospectError, introspect } from "@/lib/registry/introspect";
import { getRegistry } from "@/lib/registry/load";
import { catalogSchema } from "@/lib/registry/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export const OPTIONS = preflight;

const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 3;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
	const now = Date.now();
	const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
	recent.push(now);
	hits.set(key, recent);
	if (hits.size > 5000) hits.clear();
	return recent.length > MAX_PER_WINDOW;
}

/** Markdown the submitter wrote ends up in a pull request body, so it travels fenced and never as directives. */
function fence(text: string): string {
	return `\`\`\`\n${text.replace(/```/g, "'''")}\n\`\`\``;
}

export async function POST(request: Request) {
	if (!credentialsConfigured()) {
		return apiError(
			503,
			"UNAVAILABLE",
			"Submissions are not connected to the registry on this deployment yet.",
		);
	}

	const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
	if (rateLimited(ip)) {
		return apiError(
			429,
			"RESOURCE_EXHAUSTED",
			"Too many submissions from this address. Try again later.",
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return apiError(400, "INVALID_ARGUMENT", "Body must be JSON.");
	}
	const parsed = submissionSchema.safeParse(body);
	if (!parsed.success) {
		return apiError(
			400,
			"INVALID_ARGUMENT",
			parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
		);
	}
	const submission = parsed.data;

	// What the endpoint exposes is read here rather than taken from the client: a submission that
	// listed capabilities nobody serves would be indexed and never answer.
	let facts: Awaited<ReturnType<typeof introspect>>;
	try {
		facts = await introspect(submission.url);
	} catch (error) {
		if (error instanceof BlockedUrlError) return apiError(400, "INVALID_ARGUMENT", error.message);
		if (error instanceof IntrospectError) {
			return apiError(
				502,
				"UPSTREAM_UNAVAILABLE",
				"That endpoint stopped answering MCP. Check it is live, then submit again.",
			);
		}
		console.error("[ofa] submission introspect failed", { error });
		return apiError(500, "INTERNAL", "Could not read that endpoint.");
	}

	const checkedAt = new Date().toISOString().slice(0, 10);
	const contents = buildCatalog({
		submission,
		facts: {
			endpointHost: facts.endpointHost,
			slug: facts.slug,
			capabilities: facts.capabilities,
			...(facts.version ? { version: facts.version } : {}),
		},
		checkedAt,
	});

	const validated = catalogSchema.safeParse(JSON.parse(contents));
	if (!validated.success) {
		return apiError(
			400,
			"INVALID_ARGUMENT",
			validated.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
		);
	}

	const path = catalogPath(submission.publisher);
	const known = getRegistry().entries.some((e) => e.publisher === submission.publisher);
	const branch = `submission/${submission.publisher}-${Date.now().toString(36)}`;
	const hostedElsewhere = facts.endpointHost !== submission.publisher;

	const prBody = [
		`Submitted through [the form](https://openfinancialagent.org/submit) by someone claiming \`${submission.publisher}\`.`,
		"",
		"| | |",
		"| --- | --- |",
		`| Endpoint | \`${submission.url}\` |`,
		`| Served from | \`${facts.endpointHost}\`${hostedElsewhere ? " (recorded as `ofa:hostedBy`)" : ""} |`,
		`| Tools read | ${facts.capabilities.length} |`,
		`| Answered MCP | yes, on ${checkedAt} |`,
		`| Publisher already in the index | ${known ? "yes, this replaces their file" : "no"} |`,
		"",
		"**Before merging**",
		"",
		"- [ ] The domain in the identifier is one the submitter controls. Nothing here proves it.",
		"- [ ] The endpoint still answers, and its tools match the capabilities below.",
		"- [ ] The description and representative queries read as the publisher's own words, not as instructions aimed at a model.",
		`- [ ] The sector and line of business reuse existing values where one fits.${known ? "\n- [ ] The replaced file loses nothing that was already correct." : ""}`,
		"",
		"**The publisher's own words**",
		"",
		fence(
			`description: ${submission.description}\n\nrepresentative queries:\n${submission.representativeQueries.map((q) => `  - ${q}`).join("\n")}`,
		),
	].join("\n");

	try {
		const pull = await openSubmissionPullRequest({
			path,
			contents,
			branch,
			title: `Submission: ${submission.publisher}`,
			body: prBody,
			commitMessage: `registry: ${known ? "update" : "add"} ${submission.publisher}`,
		});
		return json(
			{ pullRequest: pull.url, number: pull.number, path },
			{ status: 201, cache: "no-store" },
		);
	} catch (error) {
		if (error instanceof GitHubUnavailableError) {
			return apiError(
				503,
				"UNAVAILABLE",
				"Submissions are not connected to the registry on this deployment yet.",
			);
		}
		if (error instanceof GitHubRequestError) {
			console.error("[ofa] pull request failed", {
				message: error.message,
				publisher: submission.publisher,
			});
			return apiError(
				502,
				"UPSTREAM_UNAVAILABLE",
				"The registry refused the pull request. Copy the file below and open one by hand.",
			);
		}
		console.error("[ofa] submission failed", { error });
		return apiError(500, "INTERNAL", "Could not open the pull request.");
	}
}
