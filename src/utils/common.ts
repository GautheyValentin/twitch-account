import faker from '@faker-js/faker';
import { BaseUser, GenerateUserOptions } from '../shared/types/app.types';
import { v4 as uuid } from 'uuid';

export function GenerateUser(options: GenerateUserOptions): BaseUser {
  const id = uuid().replace(/-/g, '');
  const birthday = faker.date.between(
    '1980-01-01T00:00:00.000Z',
    '2000-01-01T00:00:00.000Z',
  );
  return {
    id,
    username: options.username || faker.internet.userName().replace(/\./g, ''),
    password: options.password || faker.internet.password(12),
    email: `${id}@${options.email.domain}`,
    birthday: {
      day: birthday.getDate(),
      month: birthday.getMonth() + 1,
      year: birthday.getFullYear(),
    },
  };
}

export function ParseTokenCaptcha(token: string): string {
  return token
    .replace(new RegExp('funcaptcha.com', 'g'), 'client-api.arkoselabs.com')
    .replace('|pk=', '|lang=fr|pk=');
}
