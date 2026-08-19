const GH = "https://api.github.com";

export async function githubUser(token) {
  const r = await fetch(`${GH}/user`, { headers: ghHeaders(token) });
  if (!r.ok) throw new Error(`GitHub user ${r.status}`);
  return r.json();
}

export async function githubRepos(token) {
  const repos = [];
  for (let page = 1; page <= 5; page++) {
    const r = await fetch(`${GH}/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`, {
      headers: ghHeaders(token),
    });
    if (!r.ok) throw new Error(`GitHub repos ${r.status}`);
    const batch = await r.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos.map((r) => ({
    full_name: r.full_name,
    name: r.name,
    private: r.private,
    language: r.language,
    default_branch: r.default_branch,
    html_url: r.html_url,
    pushed_at: r.pushed_at,
  }));
}

export async function githubFile(token, fullName, path) {
  const r = await fetch(`${GH}/repos/${fullName}/contents/${path}`, {
    headers: { ...ghHeaders(token), Accept: "application/vnd.github.raw" },
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`${fullName}/${path} ${r.status}`);
  return r.text();
}

function ghHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    "User-Agent": "reach-hydradb",
    Accept: "application/vnd.github+json",
  };
}

export async function exchangeCode(code, redirectUri) {
  const id = process.env.GITHUB_CLIENT_ID;
  const secret = process.env.GITHUB_CLIENT_SECRET;
  const r = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: id,
      client_secret: secret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await r.json();
  if (!data.access_token) throw new Error(data.error_description || data.error || "no access_token");
  return data.access_token;
}
