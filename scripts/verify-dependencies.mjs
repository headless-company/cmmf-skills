import { verifyDependencyPolicy } from '../dist/security/dependency-policy.js';

const result = await verifyDependencyPolicy(process.cwd());
for (const warning of result.warnings) console.warn(`Warning: ${warning}`);
for (const error of result.errors) console.error(`Error: ${error}`);
if (result.errors.length) process.exitCode = 1;
else console.log('Dependency policy verification passed.');
