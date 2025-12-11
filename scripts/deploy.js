#!/usr/bin/env node
/**
 * deploy.js
 * Unified deployment script for OTA and Native updates
 * Cross-platform 
 * 
 * Usage:
 *   node scripts/deploy.js -e staging -t ota -v patch -n "Bug fixes"
 *   pnpm ship -e prod -t native -v minor
 *
 * Parameters:
 *   -p, --platform    : android, ios (default: android)
 *   -e, --environment : dev, staging, prod (default: staging)
 *   -t, --type        : ota, native (default: ota)
 *   -c, --channel     : custom channel (defaults: staging→beta, prod→stable)
 *   -v, --version     : major, minor, patch (optional - bumps version)
 *   -n, --note        : release notes (optional)
 *   -r, --required    : mandatory update (default: true)
 *   -a, --active      : activate immediately (default: true)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    gray: '\x1b[90m'
};

function log(msg, color = 'reset') {
    console.log(`${colors[color]}${msg}${colors.reset}`);
}

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const params = {
        platform: 'android',
        environment: 'staging',
        type: 'ota',
        channel: null,
        version: null,
        note: null,
        required: true,
        active: true
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const value = args[i + 1];

        switch (arg) {
            case '-p':
            case '--platform':
                params.platform = value;
                i++;
                break;
            case '-e':
            case '--environment':
                params.environment = value;
                i++;
                break;
            case '-t':
            case '--type':
                params.type = value;
                i++;
                break;
            case '-c':
            case '--channel':
                params.channel = value;
                i++;
                break;
            case '-v':
            case '--version':
                params.version = value;
                i++;
                break;
            case '-n':
            case '--note':
                params.note = value;
                i++;
                break;
            case '-r':
            case '--required':
                params.required = value !== 'false';
                i++;
                break;
            case '-a':
            case '--active':
                params.active = value !== 'false';
                i++;
                break;
        }
    }

    // Default channel based on environment
    if (!params.channel) {
        const channelMap = {
            dev: 'development',
            staging: 'beta',
            prod: 'stable'
        };
        params.channel = channelMap[params.environment];
    }

    return params;
}

// Execute command and handle errors
function exec(cmd, options = {}) {
    try {
        return execSync(cmd, {
            cwd: ROOT,
            stdio: options.silent ? 'pipe' : 'inherit',
            encoding: 'utf8',
            ...options
        });
    } catch (error) {
        if (!options.ignoreError) {
            log(`Command failed: ${cmd}`, 'red');
            process.exit(1);
        }
        throw error;
    }
}

// Load and parse environment file
function loadEnvFile(envPath) {
    const content = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    // Handle both Windows (CRLF) and Unix (LF) line endings
    content.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();
        // Skip empty lines and comments
        if (!trimmedLine || trimmedLine.startsWith('#')) return;

        const eqIndex = trimmedLine.indexOf('=');
        if (eqIndex > 0) {
            const key = trimmedLine.substring(0, eqIndex).trim();
            const value = trimmedLine.substring(eqIndex + 1).trim();
            envVars[key] = value;
        }
    });

    return envVars;
}

// Find most recent zip file
function findLatestZip() {
    const files = fs.readdirSync(ROOT)
        .filter(f => f.endsWith('.zip'))
        .map(f => ({
            name: f,
            path: path.join(ROOT, f),
            time: fs.statSync(path.join(ROOT, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

    return files[0] || null;
}

// Upload file using curl
function uploadFile(url, filePath, formData) {
    const curlArgs = ['-X', 'POST', url];

    // Add file
    curlArgs.push('-F', `${formData.fileField}=@${filePath}`);

    // Add other form fields
    for (const [key, value] of Object.entries(formData.fields)) {
        if (value !== null && value !== undefined) {
            curlArgs.push('-F', `${key}=${value}`);
        }
    }

    // Use a unique delimiter to separate body from http_code
    curlArgs.push('--silent', '--show-error', '--write-out', '|||HTTP_CODE:%{http_code}|||');

    const output = exec(`curl ${curlArgs.map(a => `"${a}"`).join(' ')}`, { silent: true });

    // Extract HTTP code using the delimiter
    const codeMatch = output.match(/\|\|\|HTTP_CODE:(\d+)\|\|\|/);
    const httpCode = codeMatch ? codeMatch[1] : '0';
    const body = output.replace(/\|\|\|HTTP_CODE:\d+\|\|\|/, '').trim();

    // Also check if response body contains success:true
    const isSuccess = httpCode === '200' || httpCode === '201' || body.includes('"success":true');

    return {
        success: isSuccess,
        code: httpCode,
        body: body
    };
}

// Main deployment function
async function deploy() {
    const params = parseArgs();

    // Step 0: Version bump if requested
    if (params.version) {
        log('', 'reset');
        log('[0] Bumping version (' + params.version + ')...', 'magenta');
        exec(`npm version ${params.version} --no-git-tag-version`, { silent: true });
    }

    // Get version from package.json
    const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const appVersion = packageJson.version;

    // Step 1: Sync version to env files
    log('', 'reset');
    log('[1] Syncing version to env files...', 'green');
    exec(`node scripts/sync-version.js --env ${params.environment} --bump`);

    // Load environment file AFTER sync (so VERSION_CODE is updated)
    const envFileMap = {
        dev: 'build/dev/.env.dev',
        staging: 'build/staging/.env.staging',
        prod: 'build/prod/.env.prod'
    };

    const envFile = path.join(ROOT, envFileMap[params.environment]);
    const envVars = loadEnvFile(envFile);

    const appIdMap = {
        dev: 'io.aybinv7.vuena.dev',
        staging: 'io.aybinv7.vuena.staging',
        prod: 'io.aybinv7.vuena'
    };

    const appId = appIdMap[params.environment];
    const apiUrl = envVars['VITE_UPDATE_API_URL'];
    const versionCode = envVars['VERSION_CODE'];

    // Display deployment info
    log('', 'reset');
    log('============================================', 'cyan');
    log('         Vuena Deployment', 'cyan');
    log('============================================', 'cyan');
    log(`  Version:     ${appVersion} (code: ${versionCode})`, 'yellow');
    log(`  Environment: ${params.environment} | Type: ${params.type}`, 'yellow');
    log(`  Platform:    ${params.platform} | Channel: ${params.channel}`, 'yellow');
    log(`  Required:    ${params.required} | Active: ${params.active}`, 'yellow');
    if (params.note) log(`  Note:        ${params.note}`, 'yellow');
    log('');

    // Step 2: Build
    log(`[2] Building for ${params.environment}...`, 'green');
    exec(`pnpm build:${params.environment}`);

    // Step 3: Trapeze
    log('', 'reset');
    log('[3] Running Trapeze...', 'green');
    exec(`pnpm trapeze:${params.environment}`);

    // Step 4: Capacitor Sync
    log('', 'reset');
    log('[4] Syncing Capacitor...', 'green');
    exec(`npx cap sync ${params.platform}`);

    // Step 5: Deploy
    log('', 'reset');

    if (params.type === 'ota') {
        // OTA deployment
        log('[5] Creating OTA bundle...', 'green');
        exec(`npx @capgo/cli bundle zip ${appId} --bundle ${appVersion} --json`, { silent: true });

        const zipFile = findLatestZip();
        if (!zipFile) {
            log('Bundle zip not created!', 'red');
            process.exit(1);
        }

        log(`  Bundle: ${zipFile.name}`, 'gray');

        log('', 'reset');
        log('[6] Uploading OTA bundle...', 'green');

        const uploadUrl = `${apiUrl}/api/admin/upload`;
        const result = uploadFile(uploadUrl, zipFile.path, {
            fileField: 'bundle',
            fields: {
                version: appVersion,
                platform: params.platform,
                channel: params.channel,
                environment: params.environment,
                required: params.required.toString(),
                active: params.active.toString(),
                release_notes: params.note
            }
        });

        if (result.success) {
            log(`  Upload successful! (HTTP ${result.code})`, 'green');
            fs.unlinkSync(zipFile.path);
            log(`  Cleaned up: ${zipFile.name}`, 'gray');
        } else {
            // Check if body indicates success even with bad HTTP code
            try {
                const responseData = JSON.parse(result.body);
                if (responseData.success) {
                    log(`  Upload successful! (Server confirmed)`, 'green');
                    log(`  Note: Server returned HTTP ${result.code} but upload succeeded`, 'yellow');
                    fs.unlinkSync(zipFile.path);
                    log(`  Cleaned up: ${zipFile.name}`, 'gray');
                } else {
                    log(`  Upload failed! HTTP ${result.code}`, 'red');
                    log(`  Response: ${result.body}`, 'gray');
                    process.exit(1);
                }
            } catch {
                log(`  Upload failed! HTTP ${result.code}`, 'red');
                log(`  Response: ${result.body}`, 'gray');
                process.exit(1);
            }
        }

    } else {
        // Native deployment
        log(`[5] Building native ${params.platform}...`, 'green');

        if (params.platform === 'android') {
            const androidDir = path.join(ROOT, 'android');
            const isWindows = process.platform === 'win32';
            const gradleCmd = isWindows ? '.\\gradlew.bat' : './gradlew';

            let apkPath;
            if (params.environment === 'prod') {
                exec(`${gradleCmd} assembleRelease`, { cwd: androidDir });
                apkPath = 'app/build/outputs/apk/release/app-release.apk';
            } else {
                exec(`${gradleCmd} assembleDebug`, { cwd: androidDir });
                apkPath = 'app/build/outputs/apk/debug/app-debug.apk';
            }

            const fullApkPath = path.join(androidDir, apkPath);
            if (!fs.existsSync(fullApkPath)) {
                log('APK not found!', 'red');
                process.exit(1);
            }

            log(`  APK: ${apkPath}`, 'gray');

            log('', 'reset');
            log('[6] Uploading native APK...', 'green');

            const uploadUrl = `${apiUrl}/api/admin/native-upload`;
            const result = uploadFile(uploadUrl, fullApkPath, {
                fileField: 'file',
                fields: {
                    version: appVersion,
                    version_code: versionCode,
                    platform: params.platform,
                    channel: params.channel,
                    environment: params.environment,
                    required: params.required.toString(),
                    active: params.active.toString(),
                    release_notes: params.note
                }
            });

            if (result.success) {
                log(`  Upload successful! (HTTP ${result.code})`, 'green');
            } else {
                // Check if body indicates success even with bad HTTP code
                try {
                    const responseData = JSON.parse(result.body);
                    if (responseData.success) {
                        log(`  Upload successful! (Server confirmed)`, 'green');
                        log(`  Note: Server returned HTTP ${result.code} but upload succeeded`, 'yellow');
                    } else {
                        log(`  Upload failed! HTTP ${result.code}`, 'red');
                        log(`  Response: ${result.body}`, 'gray');
                        process.exit(1);
                    }
                } catch {
                    log(`  Upload failed! HTTP ${result.code}`, 'red');
                    log(`  Response: ${result.body}`, 'gray');
                    process.exit(1);
                }
            }
        } else {
            log('  iOS not yet implemented', 'yellow');
        }
    }

    log('', 'reset');
    log('============================================', 'green');
    log('         Deployment Complete!', 'green');
    log('============================================', 'green');
    log(`  ${params.type} v${appVersion} → '${params.channel}' channel`, 'cyan');
    log('', 'reset');
}

// Run deployment
deploy().catch(error => {
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
});