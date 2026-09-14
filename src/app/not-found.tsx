import Link from "next/link";

export default function NotFound() {
	return (
		<div className="py-24 max-w-[520px]">
			<p className="label">404</p>
			<h1 className="text-[32px] font-bold mt-2">Not in the index.</h1>
			<p className="text-muted mt-3">
				The identifier or page does not exist. Search the{" "}
				<Link href="/" className="text-accent underline underline-offset-[3px]">
					index
				</Link>{" "}
				or read how to{" "}
				<Link href="/docs/publish" className="text-accent underline underline-offset-[3px]">
					publish a catalog
				</Link>
				.
			</p>
		</div>
	);
}
