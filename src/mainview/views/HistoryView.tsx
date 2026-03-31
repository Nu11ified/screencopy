import { useState, useCallback } from "react";
import { useCaptures } from "../hooks/useCaptures";
import { useKeyboard } from "../hooks/useKeyboard";
import { SearchBar } from "../components/SearchBar";
import { HistoryItem } from "../components/HistoryItem";
import type { Capture } from "../lib/api";

export function HistoryView({
	onSelect,
}: {
	onSelect: (capture: Capture) => void;
}) {
	const { captures, loading, query, search } = useCaptures();
	const [selectedIdx, setSelectedIdx] = useState(0);
	const [searchFocused, setSearchFocused] = useState(false);

	const selectAndOpen = useCallback(
		(idx: number) => {
			if (captures[idx]) {
				onSelect(captures[idx]);
			}
		},
		[captures, onSelect],
	);

	useKeyboard(
		{
			j: () => setSelectedIdx((i) => Math.min(i + 1, captures.length - 1)),
			arrowdown: () => setSelectedIdx((i) => Math.min(i + 1, captures.length - 1)),
			k: () => setSelectedIdx((i) => Math.max(i - 1, 0)),
			arrowup: () => setSelectedIdx((i) => Math.max(i - 1, 0)),
			enter: () => selectAndOpen(selectedIdx),
			"cmd+k": () => setSearchFocused(true),
		},
		[captures.length, selectedIdx, selectAndOpen],
	);

	return (
		<div className="view-content">
			<SearchBar
				value={query}
				onChange={search}
				focused={searchFocused}
				onFocus={() => setSearchFocused(true)}
			/>

			<div className="history-list">
				{loading && captures.length === 0 && (
					<div className="history-empty">Loading...</div>
				)}
				{!loading && captures.length === 0 && (
					<div className="history-empty">
						{query ? "No results found" : "No captures yet"}
					</div>
				)}
				{captures.map((c, i) => (
					<HistoryItem
						key={c.id}
						capture={c}
						selected={i === selectedIdx}
						onClick={() => {
							setSelectedIdx(i);
							onSelect(c);
						}}
					/>
				))}
			</div>

			{captures.length > 0 && (
				<div className="history-hint">
					<kbd>j</kbd><kbd>k</kbd> navigate &middot; <kbd>Enter</kbd> open &middot; <kbd>Cmd+K</kbd> search
				</div>
			)}
		</div>
	);
}
