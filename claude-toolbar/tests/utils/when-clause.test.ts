/**
 * Tests the when-clause builders and renderer: the exact text VS Code reads, with parentheses exactly where VS
 * Code's precedence (`!` over `==` over `&&` over `||`) would otherwise change the meaning.
 */

import { describe, expect, it } from 'vitest';
import { always, and, contextKey, equals, never, not, or, renderWhen, setting } from '../../src/utils/when-clause';

const a = contextKey('a');
const b = contextKey('b');
const c = contextKey('c');

describe('renderWhen', () => {
  it('renders a key, a setting, an equality and the constants', () => {
    expect([contextKey('editorFocus'), setting('claudeCode.focusView'), equals('view', 'claudeVSCodeSidebar'), always, never].map(renderWhen)).toEqual([
      'editorFocus',
      'config.claudeCode.focusView',
      "view == 'claudeVSCodeSidebar'",
      'true',
      'false',
    ]);
  });

  it('joins and with && and or with ||', () => {
    expect([and(a, b), or(a, b)].map(renderWhen)).toEqual(['a && b', 'a || b']);
  });

  it('puts an or inside an and in parentheses', () => {
    expect(renderWhen(and(or(a, b), c))).toBe('(a || b) && c');
  });

  it('leaves an and inside an or bare, since && binds tighter', () => {
    expect(renderWhen(or(and(a, b), c))).toBe('a && b || c');
  });

  it('negates a bare key without parentheses and anything else with them', () => {
    expect([not(a), not(equals('view', 'x')), not(and(a, b)), not(or(a, b)), not(not(a))].map(renderWhen)).toEqual([
      '!a',
      "!(view == 'x')",
      '!(a && b)',
      '!(a || b)',
      '!(!a)',
    ]);
  });

  it('renders a place and a look condition the way the manifest combines them', () => {
    expect(renderWhen(and(or(equals('view', 'p'), equals('view', 'q')), not(setting('x')), setting('y')))).toBe(
      "(view == 'p' || view == 'q') && !config.x && config.y",
    );
  });
});

describe('and and or', () => {
  it('give their identity when nothing is left', () => {
    expect([and(), or(), and(always), or(never)]).toEqual([always, never, always, never]);
  });

  it('return a single operand as it is', () => {
    expect([and(a), or(a), and(always, a), or(never, a)]).toEqual([a, a, a, a]);
  });

  it('flatten nested operands of their own kind', () => {
    expect([and(a, and(b, c)), or(or(a, b), c)].map(renderWhen)).toEqual(['a && b && c', 'a || b || c']);
  });
});

describe('the builders', () => {
  it('refuse a value with a single quote, which VS Code cannot read', () => {
    expect(() => equals('view', "it's")).toThrow(/cannot be written/);
  });

  it('refuse a key VS Code would not read as one key', () => {
    expect(() => contextKey('two words')).toThrow(/cannot be written/);
  });
});
