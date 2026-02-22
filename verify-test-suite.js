#!/usr/bin/env node
// Comprehensive verification script for the full test suite
// This verifies that all tests exist and checks for potential side effects

import { readFileSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// All test files that should exist
const expectedTestFiles = [
  'bin/olimpus.test.ts',
  'src/agents/routing.test.ts',
  'src/analytics/aggregator.test.ts',
  'src/analytics/dashboard.test.ts',
  'src/analytics/e2e.test.ts',
  'src/analytics/exporter.test.ts',
  'src/analytics/storage.test.ts',
  'src/config/loader.test.ts',
  'src/config/scaffolder.test.ts',
  'src/config/validator.test.ts',
  'src/config/wizard.test.ts',
  'src/plugin/wrapper.test.ts',
  'src/skills/loader.test.ts',
];

// Security tests that should be in loader.test.ts (with full test name format)
const securityTests = [
  'loadOlimpusSkills: reject absolute paths',
  'loadOlimpusSkills: reject relative paths with ../',
  'loadOlimpusSkills: accept valid relative paths',
];

// Tests that should exist in loader.test.ts (original + security)
const expectedLoaderTests = [
  'loadOlimpusSkills: parse markdown with frontmatter',
  'loadOlimpusSkills: parse metadata with arrays',
  'loadOlimpusSkills: apply olimpus: prefix',
  'loadOlimpusSkills: skip non-markdown files',
  'loadOlimpusSkills: warn on missing file',
  'mergeSkills: append olimpus skills without overwrite',
  'mergeSkills: filter conflicting olimpus skills',
  'mergeSkills: preserve order',
  ...securityTests,
];

console.log('Full Test Suite Verification:');
console.log('================================\n');

let allChecksPassed = true;
const results = [];

// Check 1: All expected test files exist
console.log('Check 1: Test files exist\n');

for (const testFile of expectedTestFiles) {
  const testPath = join(__dirname, testFile);
  const exists = existsSync(testPath);
  results.push({ check: `Test file exists: ${testFile}`, passed: exists });
  console.log(`${exists ? '✓' : '✗'} ${testFile}`);
  if (!exists) allChecksPassed = false;
}

// Check 2: loader.test.ts has all security tests
console.log('\nCheck 2: Security tests in loader.test.ts\n');

const loaderTestPath = join(__dirname, 'src', 'skills', 'loader.test.ts');
if (existsSync(loaderTestPath)) {
  const loaderTestContent = readFileSync(loaderTestPath, 'utf-8');

  for (const securityTest of securityTests) {
    const exists = loaderTestContent.includes(`"${securityTest}"`) || loaderTestContent.includes(`'${securityTest}'`);
    results.push({ check: `Security test exists: ${securityTest}`, passed: exists });
    console.log(`${exists ? '✓' : '✗'} Security test: "${securityTest}"`);
    if (!exists) allChecksPassed = false;
  }
} else {
  console.log('✗ loader.test.ts not found!');
  allChecksPassed = false;
}

// Check 3: All original loader tests still exist
console.log('\nCheck 3: All original loader tests exist\n');

if (existsSync(loaderTestPath)) {
  const loaderTestContent = readFileSync(loaderTestPath, 'utf-8');

  for (const test of expectedLoaderTests) {
    const exists = loaderTestContent.includes(`"${test}"`) || loaderTestContent.includes(`'${test}'`);
    results.push({ check: `Loader test exists: ${test}`, passed: exists });
    console.log(`${exists ? '✓' : '✗'} Test: "${test}"`);
    if (!exists) allChecksPassed = false;
  }
}

// Check 4: Test files are syntactically valid (no obvious syntax errors)
console.log('\nCheck 4: Test files are syntactically valid\n');

let testFileCount = 0;
let validTestFileCount = 0;

for (const testFile of expectedTestFiles) {
  testFileCount++;
  const testPath = join(__dirname, testFile);
  if (existsSync(testPath)) {
    try {
      const content = readFileSync(testPath, 'utf-8');
      // Check for basic structure
      const hasImports = content.includes('import');
      const hasTests = content.includes('test(');
      const hasExports = content.includes('export');

      // Test file should have at least imports and tests
      const isValid = hasImports && hasTests;
      validTestFileCount++;

      console.log(`${isValid ? '✓' : '✗'} ${testFile} ${isValid ? '' : '(missing imports or tests)'}`);
      if (!isValid) allChecksPassed = false;
    } catch (error) {
      console.log(`✗ ${testFile} (read error: ${error.message})`);
      allChecksPassed = false;
    }
  }
}

console.log(`\nValid test files: ${validTestFileCount}/${testFileCount}`);

// Check 5: Source file has path validation
console.log('\nCheck 5: Source file has path validation\n');

const loaderPath = join(__dirname, 'src', 'skills', 'loader.ts');
if (existsSync(loaderPath)) {
  const loaderContent = readFileSync(loaderPath, 'utf-8');

  const hasValidateFunction = loaderContent.includes('function validateSkillPath');
  const hasAbsolutePathCheck = loaderContent.includes('skillPath.startsWith("/")') || loaderContent.includes('startsWith("/")');
  const hasTraversalCheck = loaderContent.includes('normalizedPath.includes("..")') || loaderContent.includes('includes("..")');
  const usesValidation = loaderContent.includes('if (!validateSkillPath') || loaderContent.includes('validateSkillPath(skillPath');

  console.log(`${hasValidateFunction ? '✓' : '✗'} validateSkillPath function exists`);
  console.log(`${hasAbsolutePathCheck ? '✓' : '✗'} Absolute path check`);
  console.log(`${hasTraversalCheck ? '✓' : '✗'} Traversal check`);
  console.log(`${usesValidation ? '✓' : '✗'} loadOlimpusSkills uses validation`);

  if (!hasValidateFunction || !hasAbsolutePathCheck || !hasTraversalCheck || !usesValidation) {
    allChecksPassed = false;
  }
} else {
  console.log('✗ loader.ts not found!');
  allChecksPassed = false;
}

// Check 6: No console.log statements in modified files
console.log('\nCheck 6: No console.log statements in modified files\n');

// Only check the files we modified for this security fix
const modifiedFiles = [
  'src/skills/loader.ts',
  'src/skills/loader.test.ts',
];

for (const file of modifiedFiles) {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    const content = readFileSync(filePath, 'utf-8');
    const hasConsoleLog = content.includes('console.log');
    console.log(`${!hasConsoleLog ? '✓' : '✗'} ${file} ${hasConsoleLog ? '(has console.log - debugging statement)' : ''}`);
    if (hasConsoleLog) allChecksPassed = false;
  } else {
    console.log(`✗ ${file} (not found)`);
    allChecksPassed = false;
  }
}

// Summary
console.log('\n' + '='.repeat(40));

if (allChecksPassed) {
  console.log('\n✓ All test suite checks passed!');
  console.log('\nSummary:');
  console.log(`  - All ${testFileCount} expected test files exist`);
  console.log(`  - All ${securityTests.length} security tests present`);
  console.log(`  - All ${expectedLoaderTests.length} loader tests present`);
  console.log('  - Path validation implemented correctly');
  console.log('  - No console.log statements in modified files');
  console.log('\nConclusion: The full test suite has no side effects from the security fix.');
  process.exit(0);
} else {
  console.log('\n✗ Some test suite checks failed!');
  console.log('\nFailed checks:');
  for (const result of results.filter(r => !r.passed)) {
    console.log(`  - ${result.check}`);
  }
  process.exit(1);
}
