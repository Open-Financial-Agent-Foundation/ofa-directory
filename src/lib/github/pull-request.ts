const API = "https://api.github.com";

export class GitHubUnavailableError extends Error {}
export class GitHubRequestError extends Error {}

type Repo = { owner: string; repo: string; token: string; baseBranch: string };

/** Reads the repository and credentials from the environment. Absent credentials are a configuration state, not a fault. */
export function repoFromEnv(): Repo {
	const token = process.env.GITHUB_TOKEN;
	const slug = process.env.OFA_REGISTRY_REPO ?? "Open-Financial-Agent-Foundation/ofa-directory";
	const [owner, repo] = slug.split("/");
	if (!token)
		throw new GitHubUnavailableError("No GitHub credentials are configured on this deployment.");
	if (!owner || !repo)
		throw new GitHubUnavailableError(`OFA_REGISTRY_REPO is not an owner/repo slug: ${slug}`);
	return { owner, repo, token, baseBranch: process.env.OFA_REGISTRY_BRANCH ?? "main" };
}

async function call<T>(
	repo: Repo,
	path: string,
	init?: { method?: string; body?: unknown },
): Promise<T> {
	const response = await fetch(`${API}${path}`, {
		method: init?.method ?? "GET",
		headers: {
			accept: "application/vnd.github+json",
			authorization: `Bearer ${repo.token}`,
			"x-github-api-version": "2022-11-28",
			"user-agent": "open-financial-agent",
			...(init?.body ? { "content-type": "application/json" } : {}),
		},
		...(init?.body ? { body: JSON.stringify(init.body) } : {}),
		signal: AbortSignal.timeout(15_000),
	});
	if (response.status === 404) throw new GitHubRequestError("NOT_FOUND");
	if (!response.ok) {
		const detail = await response.text();
		throw new GitHubRequestError(`${response.status} ${detail.slice(0, 300)}`);
	}
	return await response.json();
}

async function existingFileSha(repo: Repo, path: string): Promise<string | undefined> {
	try {
		const file = await call<{ sha: string }>(
			repo,
			`/repos/${repo.owner}/${repo.repo}/contents/${encodeURI(path)}?ref=${repo.baseBranch}`,
		);
		return file.sha;
	} catch (error) {
		if (error instanceof GitHubRequestError && error.message === "NOT_FOUND") return undefined;
		throw error;
	}
}

/**
 * Commits one file on a fresh branch and opens a pull request for it. The submitter never needs a
 * GitHub account: the registry's own credentials carry the proposal, and a maintainer reviews it
 * the way they review any other change.
 */
export async function openSubmissionPullRequest(input: {
	path: string;
	contents: string;
	branch: string;
	title: string;
	body: string;
	commitMessage: string;
}): Promise<{ url: string; number: number }> {
	const repo = repoFromEnv();

	const base = await call<{ object: { sha: string } }>(
		repo,
		`/repos/${repo.owner}/${repo.repo}/git/ref/heads/${repo.baseBranch}`,
	);
	await call(repo, `/repos/${repo.owner}/${repo.repo}/git/refs`, {
		method: "POST",
		body: { ref: `refs/heads/${input.branch}`, sha: base.object.sha },
	});

	const sha = await existingFileSha(repo, input.path);
	await call(repo, `/repos/${repo.owner}/${repo.repo}/contents/${encodeURI(input.path)}`, {
		method: "PUT",
		body: {
			message: input.commitMessage,
			content: Buffer.from(input.contents, "utf8").toString("base64"),
			branch: input.branch,
			...(sha ? { sha } : {}),
		},
	});

	const pull = await call<{ html_url: string; number: number }>(
		repo,
		`/repos/${repo.owner}/${repo.repo}/pulls`,
		{
			method: "POST",
			body: {
				title: input.title,
				head: input.branch,
				base: repo.baseBranch,
				body: input.body,
				maintainer_can_modify: true,
			},
		},
	);
	return { url: pull.html_url, number: pull.number };
}

export function credentialsConfigured(): boolean {
	try {
		repoFromEnv();
		return true;
	} catch {
		return false;
	}
}
