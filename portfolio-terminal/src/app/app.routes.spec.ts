import { describe, expect, it } from 'vitest';

import { routes } from './app.routes';

describe('app routes', () => {
  it('should redirect unknown paths to the terminal root', () => {
    expect(routes).toContainEqual({
      path: '**',
      redirectTo: '',
    });
  });
});
