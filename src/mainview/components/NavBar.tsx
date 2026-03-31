type View = "capture" | "history" | "settings";

export function NavBar({
	active,
	onChange,
}: {
	active: View;
	onChange: (view: View) => void;
}) {
	const tabs: { id: View; label: string; icon: JSX.Element }[] = [
		{
			id: "capture",
			label: "Capture",
			icon: (
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
					<circle cx="12" cy="13" r="3" />
				</svg>
			),
		},
		{
			id: "history",
			label: "History",
			icon: (
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M12 8v4l3 3" />
					<circle cx="12" cy="12" r="10" />
				</svg>
			),
		},
		{
			id: "settings",
			label: "Settings",
			icon: (
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
					<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
					<circle cx="12" cy="12" r="3" />
				</svg>
			),
		},
	];

	return (
		<div className="navbar">
			{tabs.map((tab) => (
				<button
					key={tab.id}
					className={`navbar-tab ${active === tab.id ? "navbar-tab-active" : ""}`}
					onClick={() => onChange(tab.id)}
				>
					{tab.icon}
					<span>{tab.label}</span>
				</button>
			))}
		</div>
	);
}
