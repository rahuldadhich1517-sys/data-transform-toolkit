/**
 * Example: Using the Data Diff feature
 * Run with: npx ts-node examples/diff.ts
 */

import { dataDiff } from '../index';

console.log('=== Data Diff Examples ===\n');

// Example 1: Simple object diff
console.log('Example 1: Simple Object Diff');
const original1 = { name: 'Rahul', age: 25, city: 'Jaipur' };
const modified1 = { name: 'Rahul', age: 26, country: 'India' };

const diff1 = dataDiff(original1, modified1);
console.log('Original:', original1);
console.log('Modified:', modified1);
console.log('Changes:');
console.log('  Added:', diff1.added);
console.log('  Removed:', diff1.removed);
console.log('  Changed:', diff1.changed);
console.log('');

// Example 2: Nested object diff
console.log('Example 2: Nested Object Diff');
const original2 = {
  user: {
    name: 'Rahul',
    address: { city: 'Jaipur', country: 'India' }
  }
};
const modified2 = {
  user: {
    name: 'Rahul',
    address: { city: 'Mumbai', country: 'India' }
  }
};

const diff2 = dataDiff(original2, modified2);
console.log('Original:', JSON.stringify(original2));
console.log('Modified:', JSON.stringify(modified2));
console.log('Changed:', diff2.changed);
console.log('');

// Example 3: Array diff
console.log('Example 3: Array Diff');
const original3 = { skills: ['React', 'Node.js', 'TypeScript'] };
const modified3 = { skills: ['React', 'Vue.js', 'TypeScript', 'Python'] };

const diff3 = dataDiff(original3, modified3);
console.log('Original:', original3);
console.log('Modified:', modified3);
console.log('Summary:', diff3.summary);
console.log('');

// Example 4: Ignore specific keys
console.log('Example 4: Ignore Specific Keys');
const original4 = {
  name: 'Rahul',
  email: 'rahul@example.com',
  updatedAt: '2024-01-01T00:00:00Z'
};
const modified4 = {
  name: 'Rahul',
  email: 'newemail@example.com',
  updatedAt: '2024-01-02T00:00:00Z'
};

const diff4 = dataDiff(original4, modified4, { ignoreKeys: ['updatedAt'] });
console.log('Original:', original4);
console.log('Modified:', modified4);
console.log('Changes (ignoring updatedAt):', diff4.changed);
console.log('');

// Example 5: Case-insensitive comparison
console.log('Example 5: Case-Insensitive Comparison');
const original5 = { name: 'Rahul', status: 'Active' };
const modified5 = { name: 'RAHUL', status: 'active' };

const diff5 = dataDiff(original5, modified5, { caseInsensitive: true });
console.log('Original:', original5);
console.log('Modified:', modified5);
console.log('Has changes (case-insensitive):', diff5.hasChanges);
console.log('');

// Example 6: Track unchanged properties
console.log('Example 6: Track Unchanged Properties');
const original6 = { name: 'Rahul', age: 25, city: 'Jaipur' };
const modified6 = { name: 'Rahul', age: 25, city: 'Delhi' };

const diff6 = dataDiff(original6, modified6, { includeUnchanged: true });
console.log('Original:', original6);
console.log('Modified:', modified6);
console.log('Unchanged:', diff6.unchanged);
console.log('Changed:', diff6.changed);
