export class Logger {
  private static outputChannel = typeof (require('vscode')) !== 'undefined' 
    ? require('vscode').window.createOutputChannel('DevClipboard Pro')
    : console;

  public static info(message: string): void {
    this.log('INFO', message);
  }

  public static error(message: string, error?: unknown): void {
    let errorMessage = message;
    if (error) {
      errorMessage += ` - ${error instanceof Error ? error.stack : String(error)}`;
    }
    this.log('ERROR', errorMessage);
  }

  public static warn(message: string): void {
    this.log('WARN', message);
  }

  private static log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const formatted = `[${timestamp}] [${level}] ${message}`;
    if ('appendLine' in this.outputChannel) {
      this.outputChannel.appendLine(formatted);
    } else {
      (this.outputChannel as typeof console).log(formatted);
    }
  }
}
