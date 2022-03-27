class Exception extends Error {}

export class AntiCaptchaException extends Exception {
  constructor(message?: string) {
    super(`Anticaptcha error occured ${message}`);
  }
}

export class TwitchCreateUserException extends Exception {
  constructor(message?: string) {
    super(`Twitch service failed to create an account ${message}`);
  }
}

export class TwitchUsernameAlreadyExistException extends Exception {
  constructor() {
    super(`This username already exists.`);
  }
}

export class TwitchMailVerificationException extends Exception {
  constructor(message?: string) {
    super(`Twitch failed to verify mail ${message}`);
  }
}

export class TwitchMailParseException extends Exception {
  constructor() {
    super(`Failed to parse mail received by twitch`);
  }
}

export class TwitchCaptchaInvalidException extends Exception {
  constructor() {
    super('Captcha invalid');
  }
}

export class MailFetchException extends Exception {
  constructor(message?: string) {
    super(`Failed to fetch the mail service ${message}`);
  }
}

export class NoMailException extends Exception {
  constructor() {
    super(`There isn't mail in the box`);
  }
}
