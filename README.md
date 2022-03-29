# Twitch Account Generator

[![Npm package version](https://badgen.net/npm/v/twitch-account)](https://npmjs.com/package/twitch-account)

## Install

```sh
yarn add twitch-account
```



## Sample

```ts
  import {
    AntiCaptchaService,
    MailService,
    TwitchService,
    GenerateUser,
    ParseTokenCaptcha,
    TwitchInvalidUsernameException,
  } from './twitch-account';

  // MAIL DOMAIN
  const DOMAIN = 'chitthi.in';

  // TWITCH CLIENT ID
  const CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

  // ARKOSE FUN CATCHA KEY
  const CAPTCHA_KEY = 'E5554D43-23CC-1982-971D-6A2262A2CA24';

  const PROXY = {
    host: '<YOUR_HOST>',
    port: 443,
    auth: {
      username: '<YOUR_USERNAME>',
      password: '<YOUR_PASSWORD>',
    },
    protocol: 'http' || 'sock',
  };

  const USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Mobile Safari/537.36' 

  // Setup Service
  const MailClient = new MailService({ domain: DOMAIN, proxy: PROXY });
  const TwitchClient = new TwitchService({
    clientId: CLIENT_ID,
    userAgent: USER_AGENT,
    proxy: PROXY,
  });
  const AntiCaptcha = new AntiCaptchaService({
    apiKey: '<YOUR_ANTICAPTCHA_API_KEY>',
    proxy: PROXY,
    userAgent: USER_AGENT,
  });

  // Load default cookie from twitch
  await TwitchClient.CurlCookie();

  // We use https://tempmail.plus/en/#! to parse email
  // Some domain is available
  // You have tool to use your self email provider
  // You can pass too your self username and password
  const UserData = GenerateUser({
    email: {
      domain: MailClient.domain,
    },
  });

  // Verify if username generate is free
  if (!(await TwitchClient.isUserNameValid(UserData.username))) {
    throw new TwitchInvalidUsernameException(UserData.username);
  }

  // Solve Captcha
  const UnParsedCaptcha = await AntiCaptcha.resolve({
    url: TwitchService.SIGN_UP_URL,
    key: CAPTCHA_KEY,
  });

  // Parse Captcha
  const ParsedCaptcha = ParseTokenCaptcha(UnParsedCaptcha);

  // Generate payload for create user request
  const UserPayload = TwitchClient.generatePayload({
    user: UserData,
    token: ParsedCaptcha,
  });

  // Request create user
  // Return an object with userId and accessToken when is successful
  const User = await TwitchClient.create(UserPayload);

  // Get last mail 
  // 2nd parameter : Max retry
  // 3rd parameter : Retry interval
  const MailContent = await MailClient.getContentLastMailWithRetry(
    UserData.id,
    20,
  );

  // Get opaque id from mail content (version text)
  const OpaqueID = TwitchClient.getOpaqueIdFromMailVerification(MailContent);

  // Request to verify the email
  await TwitchClient.verifyMail(OpaqueID);
```

## TroubleShooting

Exception ``TwitchCaptchaInvalidException`` is frequent if proxy is fraud detected by the KYC service (Arkose)

## TODO
- Scrap 
  - Client ID
  - FunCapcha Token

## Licence
MIT