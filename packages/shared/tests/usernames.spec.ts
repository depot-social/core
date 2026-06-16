/// <reference types="vitest" />
import { assert, describe, test } from 'vitest';
import {
  getUsernameAbbreviationFromUser,
  getUsernameFromUser,
} from '../functions';
import { User } from '../types';

describe('username functions', () => {
  test('getUsernameFromUser should return organization title for a user belonging to an organization', () => {
    const user = {
      organization: {
        title: 'Organization Name',
      },
      firstName: 'John',
      lastName: 'Doe',
    };

    const result = getUsernameFromUser(user as User);

    assert.equal(result, 'Organization Name');
  });

  test('getUsernameFromUser should return full name for a user not belonging to an organization', () => {
    const user = {
      organization: null,
      firstName: 'John',
      lastName: 'Doe',
    };

    const result = getUsernameFromUser(user as unknown as User);

    assert.equal(result, 'John Doe');
  });

  test('getUsernameAbbreviationFromUser should return correct abbreviation for organization', () => {
    const user = {
      organization: {
        title: 'Organization Name',
      },
      firstName: 'John',
      lastName: 'Doe',
    };

    const result = getUsernameAbbreviationFromUser(user as User);

    assert.equal(result, 'ON');
  });

  test('getUsernameAbbreviationFromUser should return correct abbreviation for user', () => {
    const user = {
      organization: null,
      firstName: 'John Mayham',
      lastName: 'Doe',
    };

    const result = getUsernameAbbreviationFromUser(user as unknown as User);

    assert.equal(result, 'JMD');
  });
});
