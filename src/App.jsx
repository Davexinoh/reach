import { useCallback, useEffect, useState } from "react";
import Shell from "./components/Shell";
import CommandPalette from "./components/CommandPalette";
import Intro from "./pages/Intro";
import Landing from "./pages/Landing";
import Onboarding from "./pages/Onboarding";
import RepoSelect from "./pages/RepoSelect";
import Map from "./pages/Map";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Repositories from "./pages/Repositories";
import Packages from "./pages/Packages";
import PackageDetail from "./pages/PackageDetail";
import Simulate from "./pages/Simulate";
import Command from "./pages/Command";
import Settings from "./pages/Settings";

export default function App() {
  const [path, setPath] = useState(window.location.pathname || "/");
  const [intro, setIntro] = useState(path === "/");
  const [cmd, setCmd] = useState(false);

  const go = useCallback((p) => {
    window.history.pushState({}, "", p);
    setPath(p);
  }, []);

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname);
    window.addEventListener("popstate", onPop);
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmd(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  function onResult(res) {
    if (res.type === "simulate") go("/app/simulate");
    else if (res.type === "events") go("/app/events");
    else if (res.type === "package") go("/app/packages/" + (res.id || "").replace("pkg:", ""));
    else go("/app/events/cve-2026-4418");
  }

  if (intro && path === "/") {
    return <Intro onDone={() => setIntro(false)} />;
  }

  if (path === "/" || path === "") return <Landing go={go} />;
  if (path === "/enter") return <Onboarding go={go} />;
  if (path === "/enter/repos") return <RepoSelect go={go} />;

  const pkg = path.startsWith("/app/packages/") ? path.split("/").pop() : null;

  let page = <Map go={go} />;
  if (path === "/app/events") page = <Events go={go} />;
  else if (path.startsWith("/app/events/")) page = <EventDetail go={go} id={decodeURIComponent(path.split("/app/events/")[1] || "")} />;
  else if (path === "/app/repos") page = <Repositories go={go} />;
  else if (path === "/app/packages") page = <Packages go={go} />;
  else if (pkg && path.startsWith("/app/packages/")) page = <PackageDetail name={pkg} go={go} />;
  else if (path === "/app/simulate") page = <Simulate />;
  else if (path === "/app/command") page = <Command onCommand={() => setCmd(true)} />;
  else if (path === "/app/settings") page = <Settings />;

  return (
    <>
      <Shell path={path} go={go} onCommand={() => setCmd(true)}>
        {page}
      </Shell>
      <CommandPalette open={cmd} onClose={() => setCmd(false)} onResult={onResult} />
    </>
  );
}
