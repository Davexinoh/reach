export default function Shell({ path, go, children, onCommand }) {
  const item = (to, label) => (
    <button className={"link" + (path === to ? " on" : "")} onClick={() => go(to)}>
      {label}
    </button>
  );
  return (
    <div className="shell">
      <nav className="nav" aria-label="Primary">
        <div className="brand">REACH</div>
        {item("/app/map", "Map")}
        {item("/app/events", "Events")}
        {item("/app/repos", "Repositories")}
        {item("/app/packages", "Packages")}
        <div className="spacer" />
        {item("/app/command", "Command")}
        {item("/app/settings", "Settings")}
      </nav>
      <div className="main">
        <header className="topbar">
          <button className="search-btn" onClick={onCommand}>
            Ask Reach… <span className="k" style={{ float: "right" }}>⌘K</span>
          </button>
          <div className="k">Demo dataset · Harborline</div>
        </header>
        {children}
      </div>
    </div>
  );
}
