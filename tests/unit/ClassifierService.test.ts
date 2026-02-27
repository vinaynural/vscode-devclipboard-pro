import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClassifierService } from '../../src/services/ClassifierService';

describe('ClassifierService', () => {
  let classifier: ClassifierService;

  beforeEach(() => {
    classifier = new ClassifierService();
  });

  it('should detect JSON correctly', () => {
    const json = '{"key": "value"}';
    const result = classifier.classify(json);
    expect(result.language).toBe('json');
    expect(result.confidence).toBe(1.0);
  });

  it('should detect SQL correctly', () => {
    const sql = 'SELECT * FROM users WHERE id = 1';
    const result = classifier.classify(sql);
    expect(result.language).toBe('sql');
  });

  it('should detect Stack Trace correctly', () => {
    const stack = '    at Object.<anonymous> (c:\\workspace\\app.js:10:5)';
    const result = classifier.classify(stack);
    expect(result.language).toBe('stacktrace');
  });

  it('should fallback to plaintext', () => {
    const text = 'Hello world this is some random text';
    const result = classifier.classify(text);
    expect(result.language).toBe('plaintext');
  });

  it('should use cache for repeat snippets', () => {
    const snippet = 'const x = 10;';
    const spy = vi.spyOn(classifier as any, 'detect');
    
    classifier.classify(snippet);
    classifier.classify(snippet);
    
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
