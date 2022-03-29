import { AntiCaptchaException } from '../shared/exceptions/common.exceptions';
import { ResolveOptions } from '../shared/types/anticaptcha.types';
import { AntiCaptchaServiceOptions } from '../shared/types/app.types';
import { AntiCaptcha, TaskTypes } from 'anticaptcha';
import { AxiosProxyConfig } from 'axios';

export class AntiCaptchaService {
  private client: AntiCaptcha;

  private userAgent?: string;
  private proxy?: AxiosProxyConfig;

  constructor(options: AntiCaptchaServiceOptions) {
    this.userAgent = options.userAgent;
    this.proxy = options.proxy;
    this.client = new AntiCaptcha(options.apiKey);
  }

  async resolve(options: ResolveOptions): Promise<string> {
    try {
      const proxy = this.proxy
        ? {
            proxyType: this.proxy.protocol,
            proxyAddress: this.proxy.host,
            proxyPort: this.proxy.port,
            proxyLogin: this.proxy.auth?.username,
            proxyPassword: this.proxy.auth?.password,
          }
        : {};
      const taskId = await this.client.createTask({
        type: this.proxy ? TaskTypes.FUN_CAPTCHA : 'FunCaptchaTaskProxyless',
        websiteURL: options.url,
        websitePublicKey: options.key,
        userAgent: this.userAgent,
        ...proxy,
      });

      const {
        solution: { token },
      } = await this.client.getTaskResult(
        taskId,
        options.retry || 20,
        options.retryInterval || 2000,
      );

      return token;
    } catch (e) {
      throw new AntiCaptchaException(e?.message);
    }
  }
}
