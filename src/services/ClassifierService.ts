import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

export interface ClassificationResult {
  language: string;
  confidence: number;
}

export class ClassifierService {
  private cache: LRUCache<string, ClassificationResult>;

  constructor() {
    this.cache = new LRUCache({
      max: 500, // Cache up to 500 snippets
    });
  }

  public classify(content: string): ClassificationResult {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const cached = this.cache.get(hash);
    if (cached) return cached;

    const result = this.detect(content);
    this.cache.set(hash, result);
    return result;
  }

  private detect(content: string): ClassificationResult {
    const trimmed = content.trim();
    if (!trimmed) return { language: 'plaintext', confidence: 1.0 };

    // 1. JSON
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed);
        return { language: 'json', confidence: 1.0 };
      } catch {
        // Fall through
      }
    }

    // 2. SQL
    if (/\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|FROM|WHERE|JOIN)\b/i.test(trimmed)) {
      return { language: 'sql', confidence: 0.85 };
    }

    // 3. Stack Trace
    if (/^\s+at\s+.+\(.+:\d+:\d+\)/m.test(trimmed)) {
      return { language: 'stacktrace', confidence: 1.0 };
    }

    // 4. Shell Command
    if (/^[$#>]\s/.test(trimmed) || /^(npm |git |ls |cd |mkdir |docker |grep |awk |sed )/.test(trimmed)) {
      return { language: 'shell', confidence: 0.8 };
    }

    // 5. Python
    if (/\b(def |import |print\(|if __name__ == "__main__":)/.test(trimmed)) {
      return { language: 'python', confidence: 0.9 };
    }

    // 6. JavaScript/TS
    if (/\b(const|let|var|function|=>|require\(|import |interface |type |namespace )/.test(trimmed)) {
      return { language: 'javascript', confidence: 0.85 };
    }

    // 7. HTML
    if (/<[a-z][\s\S]*>/i.test(trimmed)) {
      return { language: 'html', confidence: 0.8 };
    }

    // 8. Log line
    if (/\[(INFO|WARN|ERROR|DEBUG|TRACE)\]/i.test(trimmed) || /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return { language: 'log', confidence: 0.7 };
    }

    return { language: 'plaintext', confidence: 1.0 };
  }
}
