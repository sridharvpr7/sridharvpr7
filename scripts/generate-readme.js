#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadAll, validateAll, lintReadme } = require('./lib');

// ---------- escaping helpers ----------
const esc = (s) => String(s).replace(/([\\`*_\[\]<>|~])/g, '\\$1');           // Markdown text
const escHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mdUrl = (u) => String(u).trim().replace(/ /g, '%20').replace(/\(/g, '%28').replace(/\)/g, '%29');
const attr = (u) => escHtml(String(u).trim());
const visible = (x) => x.visible !== false;

function groupBy(items, key) {
  const map = new Map();               // Map keeps first-seen order, so output is stable
  items.forEach((it) => { if (!map.has(it[key])) map.set(it[key], []); map.get(it[key]).push(it); });
  return map;
}

// ---------- sections ----------
function bannerBlock(p, s) {
  if (!s.showBanner) return null;
  const main = s.useStaticBanner ? (p.bannerStatic || p.banner) : p.banner;
  const alt = escHtml(`${p.name} - ${p.headline}`);
  const img = `<img src="${attr(main)}" alt="${alt}" width="100%">`;
  if (p.bannerDark && p.bannerLight) {
    return [
      '<p align="center">', '  <picture>',
      `    <source media="(prefers-color-scheme: dark)" srcset="${attr(p.bannerDark)}">`,
      `    <source media="(prefers-color-scheme: light)" srcset="${attr(p.bannerLight)}">`,
      `    ${img}`, '  </picture>', '</p>'
    ].join('\n');
  }
  return `<p align="center">\n  ${img}\n</p>`;
}

function headerBlock(p) {
  const lines = [
    `<h1 align="center">Hi, I'm ${escHtml(p.name)}</h1>`,
    `<p align="center"><b>${escHtml(p.headline)}</b></p>`
  ];
  if (p.intro) lines.push(`<p align="center"><i>${escHtml(p.intro)}</i></p>`);
  return lines.join('\n');
}

function highlightsBlock(d, s, visProjects) {
  const { profile: p, about: a, social } = d;
  const lines = [`- 🎓 **Studying:** ${esc(p.degree)} · ${esc(p.institution)} · ${esc(p.batch)}`];
  const domains = [];
  if (s.showECE) domains.push('Electronics & Communication Engineering');
  if (s.showWebDevelopment) domains.push('Web Development');
  if (domains.length) lines.push(`- ⚡ **Domains:** ${domains.map(esc).join(' + ')}`);
  if (a.learning && a.learning.length) lines.push(`- 🔭 **Learning:** ${a.learning.slice(0, 3).map(esc).join(' · ')}`);
  if (s.showProjects && visProjects.length) {
    const pr = visProjects[0];
    lines.push(`- 📦 **Featured project:** ${pr.repo ? `[${esc(pr.title)}](${mdUrl(pr.repo)})` : esc(pr.title)}`);
  }
  lines.push(`- 💻 **Code:** [github.com/${esc(p.username)}](${mdUrl(social.github)})`);
  (a.extraHighlights || []).forEach((h) => lines.push(`- ${esc(h)}`));
  return ['## Quick Highlights', '', ...lines].join('\n');
}

function domainsBlock(s, ece, web) {
  const cells = [];
  const cell = (title, skills) => {
    const cats = [...groupBy(skills, 'category').keys()];
    return ['<td width="50%" valign="top">', `<h3>${title}</h3>`, `<p>${cats.map(escHtml).join(' · ')}</p>`, '</td>'].join('\n');
  };
  if (s.showECE && ece.length) cells.push(cell('⚡ Electronics &amp; Communication Engineering', ece));
  if (s.showWebDevelopment && web.length) cells.push(cell('🌐 Web Development', web));
  if (!cells.length) return null;
  return ['## Two Domains', '', '<table>', '<tr>', cells.join('\n'), '</tr>', '</table>'].join('\n');
}

function eceBlock(ece) {
  const out = ['### ⚡ Electronics & Communication Engineering', ''];
  for (const [cat, items] of groupBy(ece, 'category')) {
    out.push(`**${esc(cat)}**`, '');
    items.forEach((sk) => {
      const parts = [`${sk.icon ? sk.icon + ' ' : ''}**${esc(sk.name)}**`];
      if (sk.description) parts[0] += ` — ${esc(sk.description)}`;
      const tail = [];
      if (sk.status) tail.push(`_${esc(sk.status)}_`);
      if (sk.project) tail.push(/^https?:/.test(sk.project) ? `[Related project](${mdUrl(sk.project)})` : esc(sk.project));
      out.push(`- ${parts[0]}${tail.length ? ' · ' + tail.join(' · ') : ''}`);
    });
    out.push('');
  }
  return out.join('\n').trimEnd();
}

function webBlock(web) {
  const out = ['### 🌐 Web Development', '', '| Category | Technologies |', '|---|---|'];
  for (const [cat, items] of groupBy(web, 'category')) {
    out.push(`| **${esc(cat)}** | ${items.map((sk) => `${sk.icon ? sk.icon + ' ' : ''}${esc(sk.name)}`).join(' · ')} |`);
  }
  return out.join('\n');
}

function skillsBlock(s, ece, web) {
  const parts = [];
  if (s.showECE && ece.length) parts.push(eceBlock(ece));
  if (s.showWebDevelopment && web.length) parts.push(webBlock(web));
  if (!parts.length) return null;
  return ['## Technical Skills', '', parts.join('\n\n')].join('\n');
}

function projectsBlock(s, projects) {
  if (!s.showProjects || !projects.length) return null;
  const labels = { web: 'Web Development', ece: 'Electronics', other: 'Project' };
  const cols = s.compactLayout === false ? 1 : 2;
  const width = Math.floor(100 / cols);
  const cards = projects.map((pr) => {
    const l = ['<td width="' + width + '%" valign="top">'];
    if (pr.image) l.push(`<img src="${attr(pr.image)}" alt="${escHtml(pr.title)} cover image" width="100%">`);
    l.push(`<h3>${pr.repo ? `<a href="${attr(pr.repo)}">${escHtml(pr.title)}</a>` : escHtml(pr.title)}</h3>`);
    l.push(`<p>${escHtml(pr.description)}</p>`);
    l.push(`<p><sub>${escHtml([labels[pr.category], pr.status].filter(Boolean).join(' · '))}</sub></p>`);
    if (pr.stack && pr.stack.length) l.push(`<p>${pr.stack.map((t) => `<code>${escHtml(t)}</code>`).join(' ')}</p>`);
    const links = [];
    if (pr.repo) links.push(`<a href="${attr(pr.repo)}">Repository</a>`);
    if (pr.demo) links.push(`<a href="${attr(pr.demo)}">Live demo</a>`);
    if (links.length) l.push(`<p>${links.join(' · ')}</p>`);
    l.push('</td>');
    return l.join('\n');
  });
  const rows = [];
  for (let i = 0; i < cards.length; i += cols) {
    const row = cards.slice(i, i + cols);
    while (row.length < cols && cols > 1) row.push(`<td width="${width}%"></td>`);
    rows.push(['<tr>', row.join('\n'), '</tr>'].join('\n'));
  }
  return ['## Featured Projects', '', '<table>', rows.join('\n'), '</table>'].join('\n');
}

function learningBlock(a) {
  const out = [];
  if (a.learning && a.learning.length) out.push(`- 🔭 **Learning:** ${a.learning.map(esc).join(' · ')}`);
  if (a.interests && a.interests.length) out.push(`- 💡 **Interests:** ${a.interests.map(esc).join(' · ')}`);
  if (!out.length) return null;
  return ['## Currently Learning & Interests', '', ...out].join('\n');
}

function educationBlock(s, e) {
  if (!s.showEducation || !e.entries.length) return null;
  const out = ['## Education', ''];
  e.entries.forEach((en) => {
    out.push(`- 🎓 **${esc(en.degree)}** — ${esc(en.institution)}${en.period ? ` · ${esc(en.period)}` : ''}${en.details ? `  \n  ${esc(en.details)}` : ''}`);
  });
  return out.join('\n');
}

function certificatesBlock(s, c) {
  if (!s.showCertificates) return null;
  const list = c.certificates.filter((x) => x.verified === true && x.url);
  if (!list.length) return null;
  const out = ['## Verified Certificates & Achievements', ''];
  list.forEach((x) => out.push(`- 🏅 [${esc(x.title)}](${mdUrl(x.url)}) — ${esc(x.issuer)}${x.date ? ` · ${esc(x.date)}` : ''}`));
  return out.join('\n');
}

function statsBlock(s, p) {
  if (!s.showStatistics) return null;
  const cards = Object.assign({ stats: true, languages: true, streak: true }, s.statsCards || {});
  if (!cards.stats && !cards.languages && !cards.streak) return null;
  const u = encodeURIComponent(p.username);
  const theme = {
    dark: 'title_color=00E5FF&text_color=C9D1D9&icon_color=8B5CF6&bg_color=00000000',
    light: 'title_color=0E7490&text_color=24292F&icon_color=6D28D9&bg_color=00000000'
  };
  const streak = {
    dark: 'background=00000000&ring=00E5FF&fire=8B5CF6&currStreakLabel=00E5FF&sideLabels=C9D1D9&currStreakNum=C9D1D9&sideNums=C9D1D9&dates=8B949E',
    light: 'background=00000000&ring=0E7490&fire=6D28D9&currStreakLabel=0E7490&sideLabels=24292F&currStreakNum=24292F&sideNums=24292F&dates=57606A'
  };
  const pic = (alt, urls, width) => [
    '  <picture>',
    `    <source media="(prefers-color-scheme: dark)" srcset="${attr(urls.dark)}">`,
    `    <img src="${attr(urls.light)}" alt="${escHtml(alt)}" width="${width}">`,
    '  </picture>'
  ].join('\n');
  const rowA = [];
  if (cards.stats) rowA.push(pic(`GitHub stats for ${p.username}`, {
    dark: `https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&hide_border=true&${theme.dark}`,
    light: `https://github-readme-stats.vercel.app/api?username=${u}&show_icons=true&hide_border=true&${theme.light}`
  }, rowAWidth(cards)));
  if (cards.languages) rowA.push(pic(`Most used languages for ${p.username}`, {
    dark: `https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&hide_border=true&langs_count=6&${theme.dark}`,
    light: `https://github-readme-stats.vercel.app/api/top-langs/?username=${u}&layout=compact&hide_border=true&langs_count=6&${theme.light}`
  }, rowAWidth(cards)));
  const out = ['## GitHub Statistics', ''];
  if (rowA.length) out.push('<p align="center">', rowA.join('\n'), '</p>', '');
  if (cards.streak) out.push('<p align="center">', pic(`Contribution streak for ${p.username}`, {
    dark: `https://streak-stats.demolab.com?user=${u}&hide_border=true&${streak.dark}`,
    light: `https://streak-stats.demolab.com?user=${u}&hide_border=true&${streak.light}`
  }, '70%'), '</p>', '');
  out.push(`<p align="center"><sub>Cards are rendered by third-party services. If one does not load, <a href="https://github.com/${attr(p.username)}">view live activity on GitHub</a>.</sub></p>`);
  return out.join('\n');
}
function rowAWidth(cards) { return cards.stats && cards.languages ? '48%' : '70%'; }

function connectBlock(s, social) {
  if (!s.showSocialLinks) return null;
  const a = (label, href) => `<a href="${attr(href)}">${escHtml(label)}</a>`;
  const links = [a('GitHub', social.github)];
  if (social.linkedin) links.push(a('LinkedIn', social.linkedin));
  if (social.email) links.push(a('Email', `mailto:${social.email.trim()}`));
  if (social.portfolio) links.push(a('Portfolio', social.portfolio));
  (social.other || []).filter((o) => o.url).forEach((o) => links.push(a(o.label, o.url)));
  return ['## Connect With Me', '', `<p align="center">${links.join(' &nbsp;·&nbsp; ')}</p>`].join('\n');
}

function footerBlock(p) {
  return `<p align="center"><sub>${escHtml(p.name)} · Electronics &amp; Communication Engineering × Web Development</sub></p>`;
}

// ---------- build ----------
function build(d) {
  const s = d.settings;
  const ece = d.eceSkills.skills.filter(visible);
  const web = d.webSkills.skills.filter(visible);
  const projects = d.projects.projects.filter(visible);
  const sections = [
    bannerBlock(d.profile, s),
    headerBlock(d.profile),
    esc(d.about.intro),
    highlightsBlock(d, s, projects),
    domainsBlock(s, ece, web),
    skillsBlock(s, ece, web),
    projectsBlock(s, projects),
    learningBlock(d.about),
    educationBlock(s, d.education),
    certificatesBlock(s, d.certificates),
    statsBlock(s, d.profile),
    connectBlock(s, d.social),
    footerBlock(d.profile)
  ].filter(Boolean);
  return sections.join('\n\n') + '\n';
}

function main() {
  const check = process.argv.includes('--check');
  const { data, errors: loadErrors } = loadAll();
  const { errors, warnings } = validateAll(data);
  const all = loadErrors.concat(errors);
  warnings.forEach((w) => console.warn(`  warning: ${w}`));
  if (all.length) {
    console.error('\nCannot generate README. Problems found:');
    all.forEach((e) => console.error(`  x ${e}`));
    process.exit(1);
  }
  const readme = build(data);
  const lint = lintReadme(readme);
  if (lint.length) {
    console.error('\nGenerated README failed the structure check:');
    lint.forEach((e) => console.error(`  x ${e}`));
    process.exit(1);
  }
  const target = path.join(ROOT, 'README.md');
  if (check) {
    const current = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';
    if (current !== readme) { console.error('README.md is out of date. Run "npm run generate".'); process.exit(1); }
    console.log('OK  README.md is up to date with the JSON data.');
    return;
  }
  fs.writeFileSync(target, readme, 'utf8');          // the only file this script writes
  console.log(`OK  README.md generated (${readme.split('\n').length - 1} lines).`);
}

main();
