import { describe, expect, it } from 'vitest';

import { formatCnic, formatExperience, formatPakistaniMobile } from './inputFormatting';

describe('application input formatting', () => {
  it('formats and limits CNIC digits', () => {
    expect(formatCnic('12345abc1234567x1')).toBe('12345-1234567-1');
    expect(formatCnic('12345-123')).toBe('12345-123');
  });

  it('keeps only the first eleven phone digits', () => {
    expect(formatPakistaniMobile('03ab001-23456789')).toBe('03001234567');
  });

  it('keeps experience numeric with one decimal place', () => {
    expect(formatExperience('4years')).toBe('4');
    expect(formatExperience('12.55')).toBe('12.5');
  });
});
