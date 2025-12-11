/**
 * sync-version.js
 * 
 * Syncs version from package.json to all environment files.
 * Auto-increments VERSION_CODE per environment.
 * 
 * Usage:
 *   node scripts/sync-version.js --env staging
 *   node scripts/sync-version.js --env prod --bump
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Parse command line args
const args = process.argv.slice(2);
const envFlag = args.indexOf('--env');
const bumpFlag = args.includes('--bump');
const targetEnv = envFlag !== -1 ? args[envFlag + 1] : null;

// Read package.json version
const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const version = packageJson.version;

// Read or create version-code.json
const versionCodePath = path.join(ROOT, 'version-code.json');
let versionCodes = { dev: 1, staging: 1, prod: 1 };

if (fs.existsSync(versionCodePath)) {
    versionCodes = JSON.parse(fs.readFileSync(versionCodePath, 'utf8'));
}

// Environment file mappings
const envFiles = {
    dev: path.join(ROOT, 'build/dev/.env.dev'),
    staging: path.join(ROOT, 'build/staging/.env.staging'),
    prod: path.join(ROOT, 'build/prod/.env.prod'),
};

/**
 * Update a single env file with version info
 */
function updateEnvFile(envPath, env) {
    if (!fs.existsSync(envPath)) {
        console.log(`  ⚠ File not found: ${envPath}`);
        return false;
    }

    let content = fs.readFileSync(envPath, 'utf8');

    // Increment version code if bumping
    if (bumpFlag) {
        versionCodes[env] = (versionCodes[env] || 0) + 1;
    }

    const versionCode = versionCodes[env];

    // Update VITE_APP_VERSION
    if (content.includes('VITE_APP_VERSION=')) {
        content = content.replace(/VITE_APP_VERSION=.*/g, `VITE_APP_VERSION=${version}`);
    }

    // Update VERSION_CODE
    if (content.includes('VERSION_CODE=')) {
        content = content.replace(/VERSION_CODE=.*/g, `VERSION_CODE=${versionCode}`);
    }

    // Update BUILD_NUMBER (same as VERSION_CODE)
    if (content.includes('BUILD_NUMBER=')) {
        content = content.replace(/BUILD_NUMBER=.*/g, `BUILD_NUMBER=${versionCode}`);
    }

    fs.writeFileSync(envPath, content);
    console.log(`  ✓ ${path.basename(envPath)}: v${version} (code: ${versionCode})`);
    return true;
}

// Main
console.log(`\n📦 Syncing version: ${version}\n`);

if (targetEnv) {
    if (!envFiles[targetEnv]) {
        console.error(`Unknown environment: ${targetEnv}`);
        process.exit(1);
    }
    updateEnvFile(envFiles[targetEnv], targetEnv);
} else {
    for (const [env, envPath] of Object.entries(envFiles)) {
        updateEnvFile(envPath, env);
    }
}

// Save version codes
fs.writeFileSync(versionCodePath, JSON.stringify(versionCodes, null, 2));
console.log(`\n✓ Version codes saved to version-code.json\n`);
