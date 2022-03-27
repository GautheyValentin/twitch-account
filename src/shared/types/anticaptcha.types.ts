import { AxiosProxyConfig } from 'axios';

export interface ResolveOptions {
  url: string;
  key: string;
  proxy?: AxiosProxyConfig;
  userAgent?: string;
  retry?: number;
  retryInterval?: number;
}
