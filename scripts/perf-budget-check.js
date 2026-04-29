#!/usr/bin/env node
/**
 * Performance Budget Checker
 *
 * Validates that the project stays within defined performance budgets.
 * Integrates with CI/CD to prevent performance regressions.
 *
 * Usage:
 *   node scripts/perf-budget-check.js
 *   node scripts/perf-budget-check.js --json
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Performance budgets configuration
const PERFORMANCE_BUDGETS = {
  // Bundle size budgets (in KB)
  bundleSize: {
    main: 500,      // Main entry point
    pluginSdk: 200, // Plugin SDK
    extensions: 100, // Per extension
  },
  
  // Performance timing budgets (in ms)
  timing: {
    startup: 2000,     // Cold start time
    messageProcessing: 100, // Message processing latency
    toolExecution: 500,     // Tool execution latency
    configLoading: 500,     // Configuration loading time
  },
  
  // Memory budgets (in MB)
  memory: {
    baseline: 100,    // Baseline memory usage
    perSession: 20,   // Memory per active session
    maxTotal: 500,    // Maximum total memory
  },
  
  // Test coverage thresholds (percentage)
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${color}${text}${colors.reset}`;
}

function checkBundleSize() {
  const results = { passed: true, warnings: [], errors: [] };
  const distPath = join(__dirname, '..', 'dist');
  
  if (!existsSync(distPath)) {
    results.warnings.push('Dist directory not found. Run `pnpm build` first.');
    return results;
  }
  
  try {
    // Check main bundle size
    const mainBundle = join(distPath, 'index.js');
    if (existsSync(mainBundle)) {
      const stats = await import('fs').then(fs => fs.statSync(mainBundle));
      const sizeKB = stats.size / 1024;
      
      if (sizeKB > PERFORMANCE_BUDGETS.bundleSize.main) {
        results.errors.push(
          `Main bundle size (${sizeKB.toFixed(2)} KB) exceeds budget (${PERFORMANCE_BUDGETS.bundleSize.main} KB)`
        );
        results.passed = false;
      } else if (sizeKB > PERFORMANCE_BUDGETS.bundleSize.main * 0.9) {
        results.warnings.push(
          `Main bundle size (${sizeKB.toFixed(2)} KB) is approaching budget (${PERFORMANCE_BUDGETS.bundleSize.main} KB)`
        );
      }
    }
    
    // Check plugin SDK bundle size
    const pluginSdkBundle = join(distPath, 'plugin-sdk', 'index.js');
    if (existsSync(pluginSdkBundle)) {
      const stats = await import('fs').then(fs => fs.statSync(pluginSdkBundle));
      const sizeKB = stats.size / 1024;
      
      if (sizeKB > PERFORMANCE_BUDGETS.bundleSize.pluginSdk) {
        results.errors.push(
          `Plugin SDK bundle size (${sizeKB.toFixed(2)} KB) exceeds budget (${PERFORMANCE_BUDGETS.bundleSize.pluginSdk} KB)`
        );
        results.passed = false;
      }
    }
  } catch (error) {
    results.warnings.push(`Error checking bundle sizes: ${error.message}`);
  }
  
  return results;
}

async function checkCoverage() {
  const results = { passed: true, warnings: [], errors: [] };
  const coveragePath = join(__dirname, '..', 'coverage', 'coverage-summary.json');
  
  if (!existsSync(coveragePath)) {
    results.warnings.push('Coverage report not found. Run `pnpm test:coverage` first.');
    return results;
  }
  
  try {
    const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));
    const total = coverageData.total;
    
    const checks = [
      { name: 'Statements', value: total.statements.pct, threshold: PERFORMANCE_BUDGETS.coverage.statements },
      { name: 'Branches', value: total.branches.pct, threshold: PERFORMANCE_BUDGETS.coverage.branches },
      { name: 'Functions', value: total.functions.pct, threshold: PERFORMANCE_BUDGETS.coverage.functions },
      { name: 'Lines', value: total.lines.pct, threshold: PERFORMANCE_BUDGETS.coverage.lines },
    ];
    
    for (const check of checks) {
      if (check.value < check.threshold) {
        results.errors.push(
          `${check.name} coverage (${check.value.toFixed(1)}%) is below threshold (${check.threshold}%)`
        );
        results.passed = false;
      } else if (check.value < check.threshold + 5) {
        results.warnings.push(
          `${check.name} coverage (${check.value.toFixed(1)}%) is close to threshold (${check.threshold}%)`
        );
      }
    }
  } catch (error) {
    results.warnings.push(`Error checking coverage: ${error.message}`);
  }
  
  return results;
}

function printResults(results, category) {
  console.log(`\n${colorize(`📊 ${category}`, colors.cyan)}`);
  console.log('─'.repeat(50));
  
  if (results.errors.length > 0) {
    for (const error of results.errors) {
      console.log(`${colorize('❌', colors.red)} ${error}`);
    }
  }
  
  if (results.warnings.length > 0) {
    for (const warning of results.warnings) {
      console.log(`${colorize('⚠️', colors.yellow)} ${warning}`);
    }
  }
  
  if (results.passed && results.warnings.length === 0) {
    console.log(`${colorize('✅', colors.green)} All checks passed`);
  } else if (results.passed) {
    console.log(`${colorize('✅', colors.green)} Passed with warnings`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  
  if (!jsonOutput) {
    console.log(colorize('🦞 OpenClaw Performance Budget Check', colors.blue));
    console.log('═'.repeat(50));
  }
  
  const allResults = {
    timestamp: new Date().toISOString(),
    budgets: PERFORMANCE_BUDGETS,
    checks: {},
    overall: { passed: true, errors: [], warnings: [] },
  };
  
  // Check bundle sizes
  const bundleResults = await checkBundleSize();
  allResults.checks.bundleSize = bundleResults;
  if (!bundleResults.passed) {
    allResults.overall.passed = false;
    allResults.overall.errors.push(...bundleResults.errors.map(e => `Bundle: ${e}`));
  }
  allResults.overall.warnings.push(...bundleResults.warnings.map(w => `Bundle: ${w}`));
  
  if (!jsonOutput) {
    printResults(bundleResults, 'Bundle Size');
  }
  
  // Check coverage
  const coverageResults = await checkCoverage();
  allResults.checks.coverage = coverageResults;
  if (!coverageResults.passed) {
    allResults.overall.passed = false;
    allResults.overall.errors.push(...coverageResults.errors.map(e => `Coverage: ${e}`));
  }
  allResults.overall.warnings.push(...coverageResults.warnings.map(w => `Coverage: ${w}`));
  
  if (!jsonOutput) {
    printResults(coverageResults, 'Test Coverage');
  }
  
  // Print summary
  if (!jsonOutput) {
    console.log('\n' + '═'.repeat(50));
    if (allResults.overall.passed) {
      console.log(colorize('✅ Performance budget check PASSED', colors.green));
    } else {
      console.log(colorize('❌ Performance budget check FAILED', colors.red));
      console.log('\nErrors:');
      for (const error of allResults.overall.errors) {
        console.log(`  ${colorize('•', colors.red)} ${error}`);
      }
    }
    
    if (allResults.overall.warnings.length > 0) {
      console.log('\nWarnings:');
      for (const warning of allResults.overall.warnings) {
        console.log(`  ${colorize('•', colors.yellow)} ${warning}`);
      }
    }
  } else {
    console.log(JSON.stringify(allResults, null, 2));
  }
  
  process.exit(allResults.overall.passed ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
