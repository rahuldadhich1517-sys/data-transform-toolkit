import { describe, it, expect } from 'vitest';
import { dataDiff } from '../index';

describe('Data Diff', () => {
  it('should detect no changes when data is identical', () => {
    const original = { name: 'Rahul', age: 25 };
    const modified = { name: 'Rahul', age: 25 };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(false);
    expect(result.added).toHaveLength(0);
    expect(result.removed).toHaveLength(0);
    expect(result.changed).toHaveLength(0);
  });

  it('should detect added properties', () => {
    const original = { name: 'Rahul' };
    const modified = { name: 'Rahul', age: 25, city: 'Jaipur' };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(true);
    expect(result.added).toHaveLength(2);
    expect(result.added.map(a => a.path)).toContain('age');
    expect(result.added.map(a => a.path)).toContain('city');
  });

  it('should detect removed properties', () => {
    const original = { name: 'Rahul', age: 25, city: 'Jaipur' };
    const modified = { name: 'Rahul' };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(true);
    expect(result.removed).toHaveLength(2);
    expect(result.removed.map(r => r.path)).toContain('age');
    expect(result.removed.map(r => r.path)).toContain('city');
  });

  it('should detect changed properties', () => {
    const original = { name: 'Rahul', age: 25 };
    const modified = { name: 'Rahul', age: 26 };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(true);
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].path).toBe('age');
    expect(result.changed[0].from).toBe(25);
    expect(result.changed[0].to).toBe(26);
  });

  it('should detect nested changes', () => {
    const original = { user: { name: 'Rahul', age: 25 } };
    const modified = { user: { name: 'Rahul', age: 26 } };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(true);
    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].path).toBe('user.age');
  });

  it('should detect array changes', () => {
    const original = { skills: ['React', 'Node.js'] };
    const modified = { skills: ['React', 'Node.js', 'TypeScript'] };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(true);
    expect(result.added.length).toBeGreaterThan(0);
  });

  it('should handle null and undefined comparison', () => {
    const original = { value: null };
    const modified = { value: undefined };

    const result = dataDiff(original, modified);

    expect(result.hasChanges).toBe(true);
  });

  it('should handle null and undefined as equal when configured', () => {
    const original = { value: null };
    const modified = { value: undefined };

    const result = dataDiff(original, modified, { treatNullAndUndefinedAsEqual: true });

    // Should show no changes for this property when treating them as equal
    const valueChange = result.changed.find(c => c.path === 'value');
    expect(valueChange).toBeUndefined();
  });

  it('should ignore specified keys', () => {
    const original = { name: 'Rahul', updatedAt: '2024-01-01' };
    const modified = { name: 'Rahul', updatedAt: '2024-01-02' };

    const result = dataDiff(original, modified, { ignoreKeys: ['updatedAt'] });

    expect(result.hasChanges).toBe(false);
  });

  it('should ignore specified paths', () => {
    const original = { user: { name: 'Rahul', email: 'old@test.com' } };
    const modified = { user: { name: 'Rahul', email: 'new@test.com' } };

    const result = dataDiff(original, modified, { ignorePaths: ['user.email'] });

    expect(result.hasChanges).toBe(false);
  });

  it('should support case-insensitive comparison', () => {
    const original = { name: 'Rahul' };
    const modified = { name: 'RAHUL' };

    const result = dataDiff(original, modified, { caseInsensitive: true });

    expect(result.changed).toHaveLength(0);
  });

  it('should support whitespace-insensitive comparison', () => {
    const original = { name: 'Rahul  Sharma' };
    const modified = { name: 'Rahul Sharma' };

    const result = dataDiff(original, modified, { ignoreWhitespace: true });

    expect(result.changed).toHaveLength(0);
  });

  it('should track unchanged properties when enabled', () => {
    const original = { name: 'Rahul', age: 25, city: 'Jaipur' };
    const modified = { name: 'Rahul', age: 25, city: 'Delhi' };

    const result = dataDiff(original, modified, { includeUnchanged: true });

    expect(result.unchanged.length).toBeGreaterThan(0);
    expect(result.unchanged.map(u => u.path)).toContain('name');
    expect(result.unchanged.map(u => u.path)).toContain('age');
  });

  it('should not track unchanged properties when disabled', () => {
    const original = { name: 'Rahul', age: 25 };
    const modified = { name: 'Rahul', age: 25 };

    const result = dataDiff(original, modified, { includeUnchanged: false });

    expect(result.unchanged).toHaveLength(0);
  });

  it('should provide accurate summary', () => {
    const original = { name: 'Rahul', age: 25, city: 'Jaipur' };
    const modified = { name: 'Rahul', age: 26, country: 'India' };

    const result = dataDiff(original, modified);

    expect(result.summary.totalAdded).toBe(1);
    expect(result.summary.totalRemoved).toBe(1);
    expect(result.summary.totalChanged).toBe(1);
    expect(result.summary.totalChanges).toBe(3);
  });

  it('should handle type changes', () => {
    const original = { value: '25' };
    const modified = { value: 25 };

    const result = dataDiff(original, modified);

    expect(result.changed).toHaveLength(1);
    expect(result.changed[0].fromType).toBe('string');
    expect(result.changed[0].toType).toBe('number');
  });

  it('should compare arrays with order by default', () => {
    const original = { items: [1, 2, 3] };
    const modified = { items: [1, 3, 2] };

    const result = dataDiff(original, modified, { compareArrayOrder: true });

    expect(result.hasChanges).toBe(true);
  });

  it('should compare arrays as sets when configured', () => {
    const original = { items: [1, 2, 3] };
    const modified = { items: [3, 2, 1] };

    const result = dataDiff(original, modified, { compareArrayOrder: false });

    // Order doesn't matter, so should be no changes
    expect(result.changed).toHaveLength(0);
  });

  describe('Complex scenarios', () => {
    it('should handle deeply nested structures', () => {
      const original = {
        company: {
          name: 'TechCorp',
          location: {
            address: {
              city: 'Bangalore',
              country: 'India'
            }
          }
        }
      };

      const modified = {
        company: {
          name: 'TechCorp',
          location: {
            address: {
              city: 'Mumbai',
              country: 'India'
            }
          }
        }
      };

      const result = dataDiff(original, modified);

      expect(result.hasChanges).toBe(true);
      expect(result.changed[0].path).toBe('company.location.address.city');
    });

    it('should handle mixed changes', () => {
      const original = {
        name: 'Rahul',
        age: 25,
        skills: ['React', 'Node.js'],
        metadata: {
          created: '2024-01-01',
          modified: '2024-01-01'
        }
      };

      const modified = {
        name: 'Rahul',
        age: 26,
        skills: ['React', 'Node.js', 'TypeScript'],
        metadata: {
          created: '2024-01-01',
          modified: '2024-01-02'
        },
        verified: true
      };

      const result = dataDiff(original, modified);

      expect(result.hasChanges).toBe(true);
      expect(result.changed.length).toBeGreaterThan(0);
      expect(result.added.length).toBeGreaterThan(0);
    });
  });
});
