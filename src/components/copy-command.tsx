"use client";

import { useState } from "react";

export function CopyCommand({ command }: { command: string }) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(command);
			setCopied(true);
			setTimeout(() => setCopied(false), 1600);
		} catch (error) {
			console.error("[ofa] copy failed", { error });
		}
	}
	return (
		<div className="flex items-center justify-between gap-4 bg-fill rounded-lg pl-5 pr-2 py-2 min-h-[56px]">
			<code className="mono text-[13.5px] text-ink overflow-x-auto whitespace-nowrap py-2">
				{command}
			</code>
			<button
				type="button"
				onClick={copy}
				aria-live="polite"
				className="shrink-0 text-[13px] font-medium text-ink bg-paper border border-rule-strong hover:border-ink rounded-lg px-3 py-2 transition-colors duration-150"
			>
				{copied ? "Copied" : "Copy"}
			</button>
		</div>
	);
}
