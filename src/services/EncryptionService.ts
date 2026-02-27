import crypto from 'crypto';
import * as vscode from 'vscode';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12;
  private readonly tagLength = 16;
  private secretKey: Buffer | null = null;

  constructor(private context: vscode.ExtensionContext) {}

  private async ensureSecret(): Promise<Buffer> {
    if (this.secretKey) return this.secretKey;

    let key = await this.context.secrets.get('devClipboard.encryptionKey');
    if (!key) {
      key = crypto.randomBytes(32).toString('hex');
      await this.context.secrets.store('devClipboard.encryptionKey', key);
    }
    
    this.secretKey = Buffer.from(key, 'hex');
    return this.secretKey;
  }

  public async encrypt(text: string): Promise<string> {
    const key = await this.ensureSecret();
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }

  public async decrypt(data: string): Promise<string> {
    const key = await this.ensureSecret();
    const buffer = Buffer.from(data, 'base64');

    const iv = buffer.subarray(0, this.ivLength);
    const tag = buffer.subarray(this.ivLength, this.ivLength + this.tagLength);
    const encrypted = buffer.subarray(this.ivLength + this.tagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
