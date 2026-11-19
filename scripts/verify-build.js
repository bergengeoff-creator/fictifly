#!/usr/bin/env node
// scripts/verify-build.js
// Runs automatically after `npm run build` (the "postbuild" script). Fails the build, and
// therefore the Vercel deploy, if the production bundle could expose anything sensitive:
//   1. source maps (they publish the original source code)
//   2. known credential formats (Anthropic, Supabase secret / service-role, Stripe secret, ...)
//   3. the literal value of any secret-looking env var present at build time
//   4. secret-looking env vars named REACT_APP_* (CRA treats every REACT_APP_* var as public)
//
// Usage: node scripts/verify-build.js [buildDir]

const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(process.argv[2] || 'build');

// REACT_APP_* vars that are designed to be public. Supabase's publishable/anon key is safe to
// ship ONLY because Row Level Security protects every table.
const PUBLIC_ENV_ALLOWLIST = new Set(['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY']);
const SECRET_NAME_RE = /KEY|SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|CREDENTIAL|DATABASE_URL|DB_URL|CONNECTION/i;

const PATTERNS = [
  ['Anthropic API key', /sk-ant-[A-Za-z0-9_-]{10,}/],
  ['Supabase secret key', /sb_secret_[A-Za-z0-9_-]{8,}/],
  ['Stripe secret/restricted key', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{10,}/],
  ['Stripe webhook secret', /whsec_[A-Za-z0-9]{10,}/],
  ['Postgres connection string', /postgres(?:ql)?:\/\/[^\s"'`]+:[^\s"'`]+@/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/],
  ['GitHub token', /\bgh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{20,}/],
  ['OpenAI key', /\bsk-(?:proj-)?[A-Za-z0-9]{32,}/],
];
const JWT_RE = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

if (!fs.existsSync(buildDir)) {
  console.error(`verify-build: ${buildDir} does not exist. Run the build first.`);
  process.exit(1);
}

const problems = [];
const rel = (p) => path.relative(process.cwd(), p);
const TEXT_EXT = /\.(js|mjs|cjs|css|html|json|txt|map|svg|xml|webmanifest)$/i;

// Env values that must never appear in the bundle.
const secretEnv = Object.entries(process.env).filter(
  ([name, value]) =>
    SECRET_NAME_RE.test(name) &&
    !PUBLIC_ENV_ALLOWLIST.has(name) &&
    typeof value === 'string' &&
    value.length >= 12
);

for (const [name] of secretEnv) {
  if (name.startsWith('REACT_APP_')) {
    problems.push(
      `env var ${name} looks secret but has the REACT_APP_ prefix, which CRA treats as public. ` +
        'Rename it (server-side only) or remove it from the build environment.'
    );
  }
}

for (const file of walk(buildDir)) {
  if (file.endsWith('.map')) {
    problems.push(`source map published: ${rel(file)} (set GENERATE_SOURCEMAP=false)`);
    continue;
  }
  if (!TEXT_EXT.test(file)) continue;
  const text = fs.readFileSync(file, 'utf8');

  if (/[#@]\s*sourceMappingURL=(?!data:)/.test(text) && /\.(js|css)$/.test(file)) {
    problems.push(`sourceMappingURL reference in ${rel(file)}`);
  }
  for (const [label, re] of PATTERNS) {
    const m = text.match(re);
    if (m) problems.push(`${label} in ${rel(file)}: ${m[0].slice(0, 12)}…`);
  }
  for (const m of text.matchAll(JWT_RE)) {
    try {
      const payload = JSON.parse(Buffer.from(m[0].split('.')[1], 'base64url').toString());
      if (payload.role && payload.role !== 'anon') {
        problems.push(`JWT with role "${payload.role}" in ${rel(file)}`);
      }
    } catch {
      /* not a decodable JWT */
    }
  }
  for (const [name, value] of secretEnv) {
    if (text.includes(value)) problems.push(`value of env var ${name} found in ${rel(file)}`);
  }
}

if (problems.length) {
  console.error('\n✖ verify-build: production bundle failed the secrets check:\n');
  for (const p of problems) console.error('  - ' + p);
  console.error('\nFix these before deploying. See docs/SECURITY.md.\n');
  process.exit(1);
}
console.log(`✓ verify-build: ${buildDir} has no source maps or secrets (${secretEnv.length} secret env values checked).`);
