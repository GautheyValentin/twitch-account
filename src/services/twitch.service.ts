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

  constructor(options: TwitchServiceOptions) {
    this.clientId = options.clientId;
    this.proxy = options.proxy;
    this.userAgent =
      options.userAgent || new UserAgent({ platform: 'Win32' }).toString();
  }

  async create(payload: CreateUserPayload): Promise<TwitchResponseCreateUser> {
    try {
      const {
        data: { userID, access_token },
      } = await axios.post(TwitchService.SIGN_UP_PASSPORT_URL, payload, {
        proxy: this.proxy,
        headers: {
          'User-Agent': this.userAgent,
        },
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
            'client-id': this.clientId,
            'User-Agent': this.userAgent,
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
}
