/**
 * Example: Basic usage of data transformation converters
 * Run with: npx ts-node examples/basic.ts
 */

import {
  jsonToCsv,
  csvToJson,
  jsonToYaml,
  yamlToJson,
  jsonToXml,
  xmlToJson,
  dataDiff
} from '../index';

// Sample data
const users = [
  { name: 'Rahul', age: 25, city: 'Jaipur', email: 'rahul@example.com' },
  { name: 'Amit', age: 26, city: 'Delhi', email: 'amit@example.com' },
  { name: 'Priya', age: 24, city: 'Mumbai', email: 'priya@example.com' }
];

console.log('=== Data Transformation Toolkit Examples ===\n');

// Example 1: JSON to CSV
console.log('1. JSON to CSV:');
const csv = jsonToCsv(users);
console.log(csv);
console.log('');

// Example 2: CSV to JSON
console.log('2. CSV to JSON:');
const parsedUsers = csvToJson(csv);
console.log(JSON.stringify(parsedUsers, null, 2));
console.log('');

// Example 3: JSON to YAML
console.log('3. JSON to YAML:');
const userObj = { users };
const yaml = jsonToYaml(userObj);
console.log(yaml);
console.log('');

// Example 4: YAML to JSON
console.log('4. YAML to JSON:');
const yamlParsed = yamlToJson(yaml);
console.log(JSON.stringify(yamlParsed, null, 2));
console.log('');

// Example 5: JSON to XML
console.log('5. JSON to XML:');
const userData = {
  users: {
    user: users.slice(0, 1)
  }
};
const xml = jsonToXml(userData);
console.log(xml);
console.log('');

// Example 6: XML to JSON
console.log('6. XML to JSON:');
const xmlParsed = xmlToJson(xml);
console.log(JSON.stringify(xmlParsed, null, 2));
console.log('');

// Example 7: Data Diff
console.log('7. Data Diff:');
const oldData = { name: 'Rahul', age: 25, city: 'Jaipur' };
const newData = { name: 'Rahul', age: 26, country: 'India' };
const diff = dataDiff(oldData, newData);
console.log(JSON.stringify(diff, null, 2));
