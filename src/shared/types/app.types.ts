import { AxiosProxyConfig } from 'axios';

export interface BaseUser {
  id: string;
  username: string;
  password: string;
  email: string;
  birthday: {
    day: number;
    month: number;
    year: number;
  };
}

export interface GeneratePayloadOptions {
  user: BaseUser;
  token?: string;
}

export interface GenerateUserOptions {
  email: {
    domain: string;
  };
  username?: string;
  password?: string;
}

export interface CreateUserPayload extends Omit<BaseUser, 'id'> {
  client_id: string;
  arkose?: {
    token: string;
  };
}

export interface TwitchResponseCreateUser {
  userId: string;
  accessToken: string;
}

export interface TwitchServiceOptions {
  proxy?: AxiosProxyConfig;
  userAgent?: string;
  clientId: string;
}

export interface AntiCaptchaServiceOptions {
  proxy?: AxiosProxyConfig;
  userAgent?: string;
  apiKey: string;
}

export interface MailServiceOptions {
  proxy?: AxiosProxyConfig;
  domain: string;
}
