import {
  TwitchCaptchaInvalidException,
  TwitchCreateUserException,
  TwitchMailParseException,
  TwitchMailVerificationException,
  TwitchUsernameAlreadyExistException,
} from '@shared/exceptions/common.exceptions';
import {
  CreateUserPayload,
  GeneratePayloadOptions,
  TwitchResponseCreateUser,
  TwitchServiceOptions,
} from '@shared/types/app.types';
import axios, { AxiosError, AxiosProxyConfig } from 'axios';
import UserAgent from 'user-agents';

export class TwitchService {
  public static SIGN_UP_URL = 'https://www.twitch.tv/signup';
  public static SIGN_UP_PASSPORT_URL = 'https://passport.twitch.tv/register';
  public static GQL_URL = 'https://gql.twitch.tv/gql';
  public static GQL_SHA_VERIFICATION_MAIL =
    '4d3cbb19003b87567cb6f59b186e989c69b0751ecdd799be6004d200014258f1';

  private userAgent: string;
  private clientId: string;
  private proxy?: AxiosProxyConfig;

  private headers: any = {
    Accept: '*/*',
    'Accept-Encoding': 'gzip, deflate, br',
    'Accept-Language': 'fr,fr-FR;q=0.8,en-US;q=0.5,en;q=0.3',
    Connection: 'keep-alive',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'same-site',
  };

  constructor(options: TwitchServiceOptions) {
    this.clientId = options.clientId;
    this.proxy = options.proxy;
    this.userAgent =
      options.userAgent || new UserAgent({ platform: 'Win32' }).toString();
    this.headers['User-Agent'] = this.userAgent;
  }

  async create(payload: CreateUserPayload): Promise<TwitchResponseCreateUser> {
    try {
      const {
        data: { userID, access_token },
      } = await axios.post(TwitchService.SIGN_UP_PASSPORT_URL, payload, {
        headers: {
          ...this.headers,
          Origin: 'https://passport.twitch.tv',
        },
        proxy: this.proxy,
      });

      return {
        userId: userID,
        accessToken: access_token,
      };
    } catch (e) {
      const error = e as AxiosError;
      if (error?.response?.data?.error_code === 1000) {
        throw new TwitchCaptchaInvalidException();
      }
      if (error?.response?.data?.error_code === 2008) {
        throw new TwitchUsernameAlreadyExistException();
      }
      console.log(error.response?.data);
      throw new TwitchCreateUserException(error.message);
    }
  }

  generatePayload(options: GeneratePayloadOptions): CreateUserPayload {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...user } = options.user;
    const payload: CreateUserPayload = {
      ...user,
      client_id: this.clientId,
    };

    if (options.token) {
      payload.arkose = {
        token: options.token,
      };
    }

    return payload;
  }

  getOpaqueIdFromMailVerification(str: string): string {
    const [, opaqueID] =
      str.match(
        /https?:\/\/www.twitch.tv\/[^\s]+email-verification\/([A-Za-z0-9]*)/im,
      ) || [];

    if (!opaqueID) throw new TwitchMailParseException();
    return opaqueID;
  }

  async isUserNameValid(username: string): Promise<boolean> {
    const {
      data: {
        data: { isUsernameAvailable },
      },
    } = await axios.post(
      TwitchService.GQL_URL,
      {
        operationName: 'UsernameValidator_User',
        variables: {
          username,
        },
        extensions: {
          persistedQuery: {
            version: 1,
            sha256Hash:
              'fd1085cf8350e309b725cf8ca91cd90cac03909a3edeeedbd0872ac912f3d660',
          },
        },
      },
      {
        headers: {
          ...this.headers,
          'client-id': this.clientId,
        },
        proxy: this.proxy,
      },
    );
    return isUsernameAvailable;
  }

  async verifyMail(opaqueID: string): Promise<void> {
    try {
      const { data } = await axios.post(
        TwitchService.GQL_URL,
        {
          operationName: 'VerifyEmail',
          variables: {
            input: {
              opaqueID,
            },
          },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash: TwitchService.GQL_SHA_VERIFICATION_MAIL,
            },
          },
        },
        {
          headers: {
            ...this.headers,
            'client-id': this.clientId,
          },
          proxy: this.proxy,
        },
      );

      if (!data?.data?.verifyContactMethod?.isSuccess) {
        throw new Error('Not a success');
      }
    } catch (e) {
      throw new TwitchMailVerificationException(e?.message);
    }
  }

  async CurlCookie(): Promise<any> {
    const { headers } = await axios.get(TwitchService.SIGN_UP_URL, {
      headers: {
        ...this.headers,
        Referer: 'https://www.google.com/',
      },
      proxy: this.proxy,
    });
    this.headers.Cookie = headers['set-cookie'];
  }
}
