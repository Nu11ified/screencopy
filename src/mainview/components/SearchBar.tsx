import { useRef, useEffect } from "react";

export function SearchBar({
	value,
	onChange,
	focused,
	onFocus,
}: {
	value: string;
	onChange: (v: string) => void;
	focused?: boolean;
	onFocus?: () => void;
}) {
	const ref = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (focused && ref.current) {
			ref.current.focus();
			ref.current.select();
		}
	}, [focused]);

	return (
		<div className="search-bar">
			<svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="11" cy="11" r="8" />
				<path d="m21 21-4.3-4.3" />
			</svg>
			<input
				ref={ref}
				type="text"
				className="search-input"
				placeholder="Search captures..."
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={onFocus}
			/>
			{value && (
				<button className="search-clear" onClick={() => onChange("")}>
					<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
						<path d="M18 6 6 18" />
						<path d="m6 6 12 12" />
					</svg>
				</button>
			)}
		</div>
	);
}
