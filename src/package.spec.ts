import {
  AntiCaptchaService,
  MailService,
  TwitchService,
  TwitchCaptchaInvalidException,
  GenerateUser,
  ParseTokenCaptcha,
} from './index';
import dotenv from 'dotenv';
import UserAgent from 'user-agents';

describe('Package Tester', () => {
  beforeEach(() => {
    dotenv.config();
  });

  it('Should create an account', async () => {
    const DOMAIN = 'chitthi.in';
    const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';
    const CAPTCHA_KEY = 'E5554D43-23CC-1982-971D-6A2262A2CA24';
    const GENERATE_CAPTCHA = true;
    const PROXY = {
      host: process.env.PROXY_HOST,
      port: Number(process.env.PROXY_PORT),
      auth: {
        username: process.env.PROXY_USER,
        password: process.env.PROXY_PASS,
      },
      protocol: process.env.PROXY_TYPE,
    };

    const USER_AGENT = new UserAgent({ platform: 'Win32' }).toString();

    const MailClient = new MailService({ domain: DOMAIN, proxy: PROXY });
    const TwitchClient = new TwitchService({
      clientId: CLIENT_ID,
      userAgent: USER_AGENT,
      proxy: PROXY,
    });
    const AntiCaptcha = new AntiCaptchaService({
      apiKey: process.env.ANTICAPTCHA_API_KEY,
      proxy: PROXY,
      userAgent: USER_AGENT,
    });

    const UserData = GenerateUser({
      email: {
        domain: MailClient.domain,
      },
    });

    let createSuccess = false;
    let User;

    do {
      let ParsedCaptcha;
      if (GENERATE_CAPTCHA) {
        console.log('Generate Captcha');

        const UnParsedCaptcha = await AntiCaptcha.resolve({
          url: TwitchService.SIGN_UP_URL,
          key: CAPTCHA_KEY,
        });

        ParsedCaptcha = ParseTokenCaptcha(UnParsedCaptcha);
      }

      const UserPayload = TwitchClient.generatePayload({
        user: UserData,
        token: ParsedCaptcha,
      });

      console.log('Create User');
      try {
        User = await TwitchClient.create(UserPayload);
        createSuccess = true;
      } catch (e) {
        if (!(e instanceof TwitchCaptchaInvalidException)) throw e;
        console.log('Captcha Failed Retry');
      }
    } while (!createSuccess);

    console.log('Get Mail');

    const MailContent = await MailClient.getContentLastMailWithRetry(
      UserData.id,
    );

    const OpaqueID = TwitchClient.getOpaqueIdFromMailVerification(MailContent);

    console.log('Verify Mail');

    await TwitchClient.verifyMail(OpaqueID);

    console.log({
      ...User,
      ...UserData,
    });
  });
});
