/**
 * When-clauses: the conditions VS Code reads to decide whether a menu item shows. This file builds them as
 * expressions and renders them to the text VS Code parses. It knows nothing of the toolbar.
 *
 * VS Code's precedence, highest first: `!`, then `==`, then `&&`, then `||`; `!` applies only to a bare key or to
 * a parenthesised expression. The renderer adds parentheses exactly where that precedence would otherwise change
 * the meaning.
 */

// ---------------------------------------------------------------------------------------------------------------
// The expression
// ---------------------------------------------------------------------------------------------------------------

/** A when-clause as an expression tree. Build it with the functions below rather than by hand. */
export type WhenClause =
  | { readonly kind: 'constant'; readonly value: boolean }
  | { readonly kind: 'key'; readonly key: string }
  | { readonly kind: 'equals'; readonly key: string; readonly value: string }
  | { readonly kind: 'not'; readonly operand: WhenClause }
  | { readonly kind: 'and'; readonly operands: readonly WhenClause[] }
  | { readonly kind: 'or'; readonly operands: readonly WhenClause[] };

/** The condition that always holds (rendered `true`). */
export const always: WhenClause = { kind: 'constant', value: true };

/** The condition that never holds (rendered `false`). */
export const never: WhenClause = { kind: 'constant', value: false };

/** The characters a context key may hold so that VS Code reads it as one key. */
const contextKeyPattern = /^[\w.:/-]+$/;

// ---------------------------------------------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------------------------------------------

/**
 * Builds the condition "this context key is set to a truthy value", such as `editorFocus`.
 * @param key the context key
 * @returns the condition
 */
export function contextKey(key: string): WhenClause {
  return { kind: 'key', key: checkedKey(key) };
}

/**
 * Builds the condition "this setting is on": the context key `config.<key>`.
 * @param key the setting's full key, such as `editor.minimap.enabled`
 * @returns the condition
 */
export function setting(key: string): WhenClause {
  return contextKey(`config.${key}`);
}

/**
 * Builds the condition `<key> == <value>`.
 * @param key the context key, such as `view`
 * @param value the value it must equal
 * @returns the condition
 */
export function equals(key: string, value: string): WhenClause {
  if (value.includes("'")) {
    throw new Error(`The value ${value} cannot be written in a when-clause: VS Code's quoted strings have no escape.`);
  }
  return { kind: 'equals', key: checkedKey(key), value };
}

/**
 * Builds the negation of a condition.
 * @param operand the condition to negate
 * @returns the condition that holds when the operand does not
 */
export function not(operand: WhenClause): WhenClause {
  return { kind: 'not', operand };
}

/**
 * Builds the condition that holds when every operand holds. Nested `and`s are flattened, `always` operands
 * dropped, and a single remaining operand is returned as it is.
 * @param operands the conditions
 * @returns the combined condition (`always` when no operand is left)
 */
export function and(...operands: readonly WhenClause[]): WhenClause {
  return combined('and', operands, always);
}

/**
 * Builds the condition that holds when any operand holds. Nested `or`s are flattened, `never` operands dropped,
 * and a single remaining operand is returned as it is.
 * @param operands the conditions
 * @returns the combined condition (`never` when no operand is left)
 */
export function or(...operands: readonly WhenClause[]): WhenClause {
  return combined('or', operands, never);
}

/**
 * Builds an `and` or `or` in its simplest form.
 * @param kind which of the two
 * @param operands the conditions to combine
 * @param identity the operand that changes nothing (`always` for `and`, `never` for `or`)
 * @returns the combined condition
 */
function combined(kind: 'and' | 'or', operands: readonly WhenClause[], identity: WhenClause): WhenClause {
  const flat = operands
    .flatMap((operand) => (operand.kind === kind ? operand.operands : [operand]))
    .filter((operand) => operand !== identity);
  if (flat.length === 0) return identity;
  if (flat.length === 1) return flat[0];
  return { kind, operands: flat };
}

/**
 * Returns a context key after checking that VS Code reads it as one key.
 * @param key the context key
 * @returns the same key
 */
function checkedKey(key: string): string {
  if (!contextKeyPattern.test(key)) throw new Error(`The context key ${key} cannot be written in a when-clause.`);
  return key;
}

// ---------------------------------------------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------------------------------------------

/**
 * Renders a when-clause to the text VS Code reads, with parentheses wherever its precedence needs them.
 * @param clause the condition
 * @returns the text, such as `(view == 'a' || view == 'b') && config.x`
 */
export function renderWhen(clause: WhenClause): string {
  switch (clause.kind) {
    case 'constant':
      return String(clause.value);
    case 'key':
      return clause.key;
    case 'equals':
      return `${clause.key} == '${clause.value}'`;
    case 'not':
      return `!${clause.operand.kind === 'key' ? clause.operand.key : parenthesised(clause.operand)}`;
    case 'and':
      return clause.operands.map((operand) => (operand.kind === 'or' ? parenthesised(operand) : renderWhen(operand))).join(' && ');
    case 'or':
      return clause.operands.map(renderWhen).join(' || ');
  }
}

/**
 * Renders a condition inside parentheses.
 * @param clause the condition
 * @returns `(<text>)`
 */
function parenthesised(clause: WhenClause): string {
  return `(${renderWhen(clause)})`;
}
