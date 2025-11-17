#!/usr/bin/env node

import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

// Generate a random commit message
const randomString = randomBytes(8).toString('hex');
const commitMessage = `Quick commit: ${randomString}`;

try {
    console.log('🔄 Pulling latest changes...');
    execSync('git pull', { stdio: 'inherit' });

    console.log('📝 Staging all changes...');
    execSync('git add -A', { stdio: 'inherit' });

    // Try to commit - will fail gracefully if nothing to commit
    try {
        console.log(`💾 Committing with message: ${commitMessage}`);
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });

        console.log('🚀 Pushing to remote...');
        execSync('git push', { stdio: 'inherit' });
        console.log('✅ Done!');
    } catch (commitError) {
        if (commitError.status === 1) {
            console.log('ℹ️  No changes to commit. Already up to date!');
        } else {
            throw commitError;
        }
    }
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

