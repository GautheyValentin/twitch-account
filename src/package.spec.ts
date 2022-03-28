import {
  AntiCaptchaService,
  MailService,
  TwitchService,
  GenerateUser,
  ParseTokenCaptcha,
  TwitchInvalidUsernameException,
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
    // const PROXY = undefined;
    const PROXY = {
      host: process.env.PROXY_HOST,
      port: Number(process.env.PROXY_PORT),
      auth: {
        username: process.env.PROXY_USER,
        password: process.env.PROXY_PASS,
      },
      protocol: process.env.PROXY_TYPE,
    };

    const USER_AGENT = new UserAgent({
      deviceCategory: 'mobile',
      connection: {
        effectiveType: '4g',
      },
    }).toString();

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

    console.log('Generate Traditional Cookie');

    await TwitchClient.CurlCookie();

    const UserData = GenerateUser({
      email: {
        domain: MailClient.domain,
      },
    });

    console.log(`Verify username : ${UserData.username}`);

    if (!(await TwitchClient.isUserNameValid(UserData.username))) {
      throw new TwitchInvalidUsernameException(UserData.username);
    }

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

    const User = await TwitchClient.create(UserPayload);

    console.log({
      ...User,
      ...UserData,
    });

    console.log('Get Mail');

    const MailContent = await MailClient.getContentLastMailWithRetry(
      UserData.id,
      20,
    );

    const OpaqueID = TwitchClient.getOpaqueIdFromMailVerification(MailContent);

    console.log('Verify Mail');

    await TwitchClient.verifyMail(OpaqueID);
  });
});
