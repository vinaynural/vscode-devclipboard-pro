import { useEffect, useCallback } from 'react';
import { WebviewMessage, ExtensionMessage } from '../types/messages';

declare const acquireVsCodeApi: () => {
  postMessage: (message: WebviewMessage) => void;
  setState: (state: any) => void;
  getState: () => any;
};

const vscode = typeof acquireVsCodeApi !== 'undefined' ? acquireVsCodeApi() : null;

export function useVSCodeBridge(onMessage: (message: ExtensionMessage) => void) {
  useEffect(() => {
    const handler = (event: MessageEvent<ExtensionMessage>) => {
      onMessage(event.data);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onMessage]);

  const postMessage = useCallback((message: WebviewMessage) => {
    if (vscode) {
      vscode.postMessage(message);
    } else {
      console.log('Webview (mock):', message);
    }
  }, []);

  return { postMessage };
}
