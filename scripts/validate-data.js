#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const { ROOT, loadAll, validateAll, lintReadme } = require('./lib');

const { data, errors: loadErrors } = loadAll();
const { errors, warnings } = validateAll(data);
const all = loadErrors.concat(errors);

warnings.forEach((w) => console.warn(`  warning: ${w}`));
if (all.length) {
  console.error('\nValidation FAILED:');
  all.forEach((e) => console.error(`  x ${e}`));
  console.error(`\n${all.length} problem(s). Fix the JSON files in data/ and run "npm run validate" again.`);
  process.exit(1);
}
console.log('OK  all 9 data files are valid.');

const readme = path.join(ROOT, 'README.md');
if (fs.existsSync(readme)) {
  const lint = lintReadme(fs.readFileSync(readme, 'utf8'));
  if (lint.length) {
    console.error('\nREADME.md lint FAILED:');
    lint.forEach((e) => console.error(`  x ${e}`));
    process.exit(1);
  }
  console.log('OK  README.md passes the structure check.');
} else {
  console.log('--  README.md not generated yet. Run "npm run generate".');
}
