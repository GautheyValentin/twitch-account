import {
  MailFetchException,
  NoMailException,
} from '../shared/exceptions/common.exceptions';
import { MailServiceOptions } from '../shared/types/app.types';
import { AllMailResponse } from '../shared/types/mail.types';
import axios, { AxiosProxyConfig } from 'axios';

export class MailService {
  public static API_URL = `https://tempmail.plus/api/mails`;

  public readonly domain: string;

  private proxy?: AxiosProxyConfig;

  constructor(options: MailServiceOptions) {
    this.domain = options.domain;
    this.proxy = options.proxy;
  }

  async getAllMails(name: string): Promise<AllMailResponse> {
    try {
      const {
        data: { count, mail_list },
      } = await axios.get(MailService.API_URL, {
        proxy: this.proxy,
        params: {
          email: `${name}@${this.domain}`,
        },
      });
      return {
        count,
        mails: mail_list,
      };
    } catch (e) {
      throw new MailFetchException(e?.message);
    }
  }

  async getContentLastMail(name: string): Promise<string> {
    const { count, mails } = await this.getAllMails(name);
    if (!count) throw new NoMailException();

    try {
      const {
        data: { text },
      } = await axios.get(`${MailService.API_URL}/${mails[0].mail_id}`, {
        proxy: this.proxy,
        params: {
          email: `${name}@${this.domain}`,
        },
      });
      return text;
    } catch (e) {
      throw new MailFetchException(e?.message);
    }
  }

  async getContentLastMailWithRetry(
    name: string,
    retry = 5,
    retryInterval = 2000,
  ): Promise<string> {
    for (let i = 0; i < retry; i += 1) {
      try {
        const result = await this.getContentLastMail(name);
        return result;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
    throw new NoMailException();
  }
}
