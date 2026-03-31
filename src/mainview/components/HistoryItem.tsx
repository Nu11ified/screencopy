import { api, type Capture } from "../lib/api";

export function HistoryItem({
	capture,
	selected,
	onClick,
}: {
	capture: Capture;
	selected: boolean;
	onClick: () => void;
}) {
	const time = formatTime(capture.createdAt);
	const preview = capture.text.replace(/\n/g, " ").slice(0, 80);

	return (
		<button
			className={`history-item ${selected ? "history-item-selected" : ""}`}
			onClick={onClick}
		>
			<img
				className="history-thumb"
				src={api.getImageUrl(capture.id)}
				alt=""
				loading="lazy"
			/>
			<div className="history-info">
				<div className="history-text">{preview || "(no text)"}</div>
				<div className="history-meta">
					<span>{capture.mode}</span>
					<span>{time}</span>
				</div>
			</div>
		</button>
	);
}

function formatTime(ts: number): string {
	const d = new Date(ts);
	const now = new Date();
	const diff = now.getTime() - ts;

	if (diff < 60000) return "just now";
	if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
	if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
	if (d.toDateString() === new Date(now.getTime() - 86400000).toDateString())
		return "yesterday";

	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
