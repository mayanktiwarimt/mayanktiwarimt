const fs = require('fs');
const fetch = require('node-fetch');

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;

async function getLanguages() {
  const repos = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`, {
    headers: { Authorization: `token ${token}` }
  }).then(res => res.json());

  const totals = {};
  for (const repo of repos) {
    const langs = await fetch(repo.languages_url, {
      headers: { Authorization: `token ${token}` }
    }).then(res => res.json());
    for (const [lang, val] of Object.entries(langs)) {
      totals[lang] = (totals[lang] || 0) + val;
    }
  }

  const sum = Object.values(totals).reduce((a, b) => a + b, 0);
  const table = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([lang, val]) => `|  ${lang} | ${(val / sum * 100).toFixed(2)}% |`)
    .join('\n');

  return table;
}

async function getTopRepo() {
  const repos = await fetch(`https://api.github.com/search/repositories?q=user:${username}&sort=stars&order=desc`, {
    headers: { Authorization: `token ${token}` }
  }).then(res => res.json());

  if (repos.items.length > 0) {
    const top = repos.items[0];
    return `- role: maintainer & active PRs  \n- ⭐ ${top.stargazers_count} • good README • live demo`;
  }
  return "- No repos found";
}

(async () => {
  let readme = fs.readFileSync('README.md', 'utf8');

  const langTable = await getLanguages();
  const topRepoText = await getTopRepo();

  readme = readme.replace(
    /<!-- LANGUAGES_USED -->([\s\S]*?)<!-- LANGUAGES_USED_END -->/,
    `<!-- LANGUAGES_USED -->\n${langTable}\n<!-- LANGUAGES_USED_END -->`
  );

  readme = readme.replace(
    /<!-- TOP_REPO -->([\s\S]*?)<!-- TOP_REPO_END -->/,
    `<!-- TOP_REPO -->\n${topRepoText}\n<!-- TOP_REPO_END -->`
  );

  fs.writeFileSync('README.md', readme);
})();
