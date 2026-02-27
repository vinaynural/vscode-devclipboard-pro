import { parentPort } from 'worker_threads';
import { ClassifierService } from '../services/ClassifierService';

if (parentPort) {
  const classifier = new ClassifierService();

  parentPort.on('message', (message) => {
    const { type, content } = message;
    
    if (type === 'CLASSIFY') {
      const result = classifier.classify(content);
      parentPort?.postMessage({ type: 'CLASSIFIED', result });
    }
  });
}
