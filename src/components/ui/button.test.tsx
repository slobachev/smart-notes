import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Button } from './button';

describe('Button', () => {
  it('renders label and reacts to clicks', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    const btn = screen.getByRole('button', { name: 'Save' });
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(btn).toHaveAttribute('data-variant', 'default');
  });
});
