'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const FILES = {
  profile: 'profile.json',
  about: 'about.json',
  eceSkills: 'skills-ece.json',
  webSkills: 'skills-web.json',
  projects: 'projects.json',
  education: 'education.json',
  certificates: 'certificates.json',
  social: 'social-links.json',
  settings: 'settings.json'
};
const STATUSES = ['Exploring', 'Learning', 'Practicing', 'Used in a project'];
const CATEGORIES = ['ece', 'web', 'other'];

const isStr = (v) => typeof v === 'string';
const nonEmpty = (v) => isStr(v) && v.trim().length > 0;
const isObj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
function isHttpUrl(v) {
  try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; } catch (e) { return false; }
}

function loadAll() {
  const data = {};
  const errors = [];
  for (const [key, file] of Object.entries(FILES)) {
    const p = path.join(DATA_DIR, file);
    if (!fs.existsSync(p)) { errors.push(`data/${file}: file is missing`); continue; }
    try { data[key] = JSON.parse(fs.readFileSync(p, 'utf8')); }
    catch (e) { errors.push(`data/${file}: invalid JSON (${e.message})`); }
  }
  return { data, errors };
}

function validateAll(data) {
  const errors = [];
  const warnings = [];
  const err = (file, msg) => errors.push(`data/${file}: ${msg}`);
  const warn = (file, msg) => warnings.push(`data/${file}: ${msg}`);

  const reqStr = (o, k, file, ctx = '') => {
    if (!nonEmpty(o[k])) err(file, `${ctx}"${k}" is required and must be a non-empty string`);
  };
  const optStr = (o, k, file, ctx = '') => {
    if (o[k] !== undefined && !isStr(o[k])) err(file, `${ctx}"${k}" must be a string`);
  };
  const optBool = (o, k, file, ctx = '') => {
    if (o[k] !== undefined && typeof o[k] !== 'boolean') err(file, `${ctx}"${k}" must be true or false`);
  };
  const optUrl = (o, k, file, ctx = '') => {
    if (o[k] === undefined || o[k] === '') return;
    if (!isStr(o[k]) || !isHttpUrl(o[k])) err(file, `${ctx}"${k}" must be empty or a full http(s) URL (got ${JSON.stringify(o[k])})`);
  };
  const strArray = (o, k, file) => {
    if (o[k] === undefined) return;
    if (!Array.isArray(o[k]) || o[k].some((x) => !nonEmpty(x))) err(file, `"${k}" must be an array of non-empty strings`);
  };
  const asset = (value, file, label) => {
    if (!nonEmpty(value) || isHttpUrl(value)) return;
    const abs = path.resolve(ROOT, value);
    if (!abs.startsWith(ROOT + path.sep)) { err(file, `${label} must stay inside the project folder`); return; }
    if (!fs.existsSync(abs)) err(file, `${label} points to "${value}" but that file does not exist`);
  };

  // profile
  if (data.profile) {
    const f = FILES.profile; const p = data.profile;
    if (!isObj(p)) err(f, 'must be a JSON object');
    else {
      ['name', 'username', 'headline', 'degree', 'institution', 'batch', 'banner'].forEach((k) => reqStr(p, k, f));
      if (nonEmpty(p.username) && !/^[A-Za-z0-9-]+$/.test(p.username)) err(f, '"username" may only contain letters, numbers and hyphens');
      ['intro', 'bannerStatic', 'bannerDark', 'bannerLight'].forEach((k) => optStr(p, k, f));
      asset(p.banner, f, '"banner"');
      ['bannerStatic', 'bannerDark', 'bannerLight'].forEach((k) => asset(p[k], f, `"${k}"`));
      if ((p.bannerDark && !p.bannerLight) || (!p.bannerDark && p.bannerLight)) warn(f, 'set both "bannerDark" and "bannerLight" to enable theme-specific banners; otherwise they are ignored');
    }
  }

  // about
  if (data.about) {
    const f = FILES.about; const a = data.about;
    if (!isObj(a)) err(f, 'must be a JSON object');
    else { reqStr(a, 'intro', f); ['extraHighlights', 'learning', 'interests'].forEach((k) => strArray(a, k, f)); }
  }

  // skills
  const skillFile = (key, label) => {
    const f = FILES[key]; const s = data[key];
    if (!s) return;
    if (!isObj(s) || !Array.isArray(s.skills)) { err(f, '"skills" must be an array'); return; }
    s.skills.forEach((sk, i) => {
      const ctx = `skills[${i}]: `;
      if (!isObj(sk)) { err(f, `${ctx}must be an object`); return; }
      reqStr(sk, 'name', f, ctx); reqStr(sk, 'category', f, ctx);
      ['icon', 'description', 'project'].forEach((k) => optStr(sk, k, f, ctx));
      optBool(sk, 'visible', f, ctx);
      if (sk.status !== undefined && !STATUSES.includes(sk.status)) err(f, `${ctx}"status" must be one of: ${STATUSES.join(', ')}`);
    });
    if (!s.skills.some((x) => isObj(x) && x.visible !== false)) warn(f, `no visible ${label} skills; that section will be hidden`);
  };
  skillFile('eceSkills', 'ECE');
  skillFile('webSkills', 'web');

  // projects
  if (data.projects) {
    const f = FILES.projects; const p = data.projects;
    if (!isObj(p) || !Array.isArray(p.projects)) err(f, '"projects" must be an array');
    else {
      p.projects.forEach((pr, i) => {
        const ctx = `projects[${i}]: `;
        if (!isObj(pr)) { err(f, `${ctx}must be an object`); return; }
        reqStr(pr, 'title', f, ctx); reqStr(pr, 'description', f, ctx);
        if (!CATEGORIES.includes(pr.category)) err(f, `${ctx}"category" must be one of: ${CATEGORIES.join(', ')}`);
        strArray(pr, 'stack', f);
        optUrl(pr, 'repo', f, ctx); optUrl(pr, 'demo', f, ctx);
        optStr(pr, 'status', f, ctx); optStr(pr, 'image', f, ctx); optBool(pr, 'visible', f, ctx);
        if (pr.image) asset(pr.image, f, `${ctx}"image"`);
        if (!pr.repo && !pr.demo) warn(f, `${ctx}"${pr.title}" has no repo or demo link`);
      });
    }
  }

  // education
  if (data.education) {
    const f = FILES.education; const e = data.education;
    if (!isObj(e) || !Array.isArray(e.entries)) err(f, '"entries" must be an array');
    else e.entries.forEach((en, i) => {
      const ctx = `entries[${i}]: `;
      if (!isObj(en)) { err(f, `${ctx}must be an object`); return; }
      reqStr(en, 'degree', f, ctx); reqStr(en, 'institution', f, ctx);
      optStr(en, 'period', f, ctx); optStr(en, 'details', f, ctx);
    });
  }

  // certificates
  if (data.certificates) {
    const f = FILES.certificates; const c = data.certificates;
    if (!isObj(c) || !Array.isArray(c.certificates)) err(f, '"certificates" must be an array');
    else c.certificates.forEach((ce, i) => {
      const ctx = `certificates[${i}]: `;
      if (!isObj(ce)) { err(f, `${ctx}must be an object`); return; }
      reqStr(ce, 'title', f, ctx); reqStr(ce, 'issuer', f, ctx);
      optStr(ce, 'date', f, ctx); optUrl(ce, 'url', f, ctx);
      if (typeof ce.verified !== 'boolean') err(f, `${ctx}"verified" is required (true or false)`);
      else if (ce.verified && !nonEmpty(ce.url)) err(f, `${ctx}verified certificates need a "url" to the credential`);
    });
  }

  // social
  if (data.social) {
    const f = FILES.social; const s = data.social;
    if (!isObj(s)) err(f, 'must be a JSON object');
    else {
      if (!nonEmpty(s.github) || !isHttpUrl(s.github)) err(f, '"github" is required and must be a full URL');
      optUrl(s, 'linkedin', f); optUrl(s, 'portfolio', f);
      if (s.email !== undefined && s.email !== '' && (!isStr(s.email) || !isEmail(s.email))) err(f, '"email" must be empty or a valid email address');
      if (s.other !== undefined) {
        if (!Array.isArray(s.other)) err(f, '"other" must be an array of { "label", "url" }');
        else s.other.forEach((o, i) => {
          if (!isObj(o) || !nonEmpty(o.label)) { err(f, `other[${i}]: "label" is required`); return; }
          if (o.url && !isHttpUrl(o.url)) err(f, `other[${i}]: "url" must be a full URL`);
          if (!o.url) warn(f, `other[${i}] ("${o.label}") has no url and will be hidden`);
        });
      }
    }
  }

  // settings
  if (data.settings) {
    const f = FILES.settings; const s = data.settings;
    if (!isObj(s)) err(f, 'must be a JSON object');
    else {
      ['showBanner', 'showECE', 'showWebDevelopment', 'showProjects', 'showEducation', 'showCertificates', 'showStatistics', 'showSocialLinks']
        .forEach((k) => { if (typeof s[k] !== 'boolean') err(f, `"${k}" is required (true or false)`); });
      optBool(s, 'compactLayout', f); optBool(s, 'useStaticBanner', f);
      if (s.defaultTheme !== undefined && !['dark', 'light', 'auto'].includes(s.defaultTheme)) err(f, '"defaultTheme" must be dark, light or auto');
      if (s.statsCards !== undefined) {
        if (!isObj(s.statsCards)) err(f, '"statsCards" must be an object');
        else ['stats', 'languages', 'streak'].forEach((k) => optBool(s.statsCards, k, f, 'statsCards.'));
      }
    }
  }
  return { errors, warnings };
}

// Lightweight structural lint of the generated Markdown/HTML.
function lintReadme(text) {
  const errors = [];
  const count = (re) => (text.match(re) || []).length;
  if (count(/^```/gm) % 2 !== 0) errors.push('README.md: unbalanced code fences');
  for (const tag of ['picture', 'table', 'tr', 'td', 'p', 'h1', 'h2', 'h3', 'a', 'b', 'i', 'code', 'sub']) {
    const open = count(new RegExp(`<${tag}(\\s[^>]*)?>`, 'g'));
    const close = count(new RegExp(`</${tag}>`, 'g'));
    if (open !== close) errors.push(`README.md: <${tag}> opened ${open}x but closed ${close}x`);
  }
  if (/<script|<style|javascript:/i.test(text)) errors.push('README.md: contains <script>, <style> or javascript: (not allowed on GitHub)');
  if (/\]\(\s*\)/.test(text)) errors.push('README.md: contains a Markdown link with an empty target');
  if (/href=""|src=""|srcset=""/.test(text)) errors.push('README.md: contains an empty href/src');
  const refs = [...text.matchAll(/(?:src|srcset|href)="([^"]+)"/g)].map((m) => m[1])
    .concat([...text.matchAll(/\]\(([^)\s]+)\)/g)].map((m) => m[1]));
  for (const r of refs) {
    if (/^(https?:|mailto:|#)/.test(r)) continue;
    if (!fs.existsSync(path.resolve(ROOT, decodeURIComponent(r)))) errors.push(`README.md: local reference "${r}" does not exist`);
  }
  return errors;
}

module.exports = { ROOT, DATA_DIR, FILES, loadAll, validateAll, lintReadme, isHttpUrl };
