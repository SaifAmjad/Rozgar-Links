import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TextInput } from './TextInput';

describe('TextInput', () => {
  it('connects its label, description and error to the input', () => {
    render(
      <TextInput
        description="Use a public-safe contact address."
        error="Enter a valid email address."
        label="Email"
        required
        type="email"
      />,
    );

    const input = screen.getByRole('textbox', { name: /email/i });
    const description = screen.getByText('Use a public-safe contact address.');
    const error = screen.getByText('Enter a valid email address.');

    expect(input).toBeRequired();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', `${description.id} ${error.id}`);
  });
});
