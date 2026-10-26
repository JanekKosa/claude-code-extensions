/**
 * Evaluates built when-clauses the way VS Code evaluates them, for tests: a bare key holds when its value is
 * truthy, `==` compares loosely (as VS Code's ContextKeyEqualsExpr does), and `!`, `&&`, `||` are the logical
 * operators. Also lists every combination of values worth trying for the keys a set of clauses reads.
 */

import type { WhenClause } from '../../src/utils/when-clause';

/** Context key values, by key (settings as `config.<key>`). */
export type WhenContext = Readonly<Record<string, unknown>>;

// ---------------------------------------------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------------------------------------------

/**
 * Evaluates a when-clause in a context.
 * @param clause the condition
 * @param context the context key values
 * @returns whether the condition holds
 */
export function evaluateWhen(clause: WhenClause, context: WhenContext): boolean {
  switch (clause.kind) {
    case 'constant':
      return clause.value;
    case 'key':
      return Boolean(context[clause.key]);
    case 'equals':
      return context[clause.key] == clause.value;
    case 'not':
      return !evaluateWhen(clause.operand, context);
    case 'and':
      return clause.operands.every((operand) => evaluateWhen(operand, context));
    case 'or':
      return clause.operands.some((operand) => evaluateWhen(operand, context));
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Combinations
// ---------------------------------------------------------------------------------------------------------------

/**
 * Lists every context key the clauses read, with the values worth trying for it: true, false, and every value
 * the clauses compare it with.
 * @param clauses the conditions
 * @returns the candidate values by key
 */
export function candidateValues(clauses: readonly WhenClause[]): Map<string, unknown[]> {
  const candidates = new Map<string, Set<unknown>>();
  const valuesOf = (key: string): Set<unknown> => candidates.get(key) ?? candidates.set(key, new Set([true, false])).get(key)!;
  const visit = (clause: WhenClause): void => {
    if (clause.kind === 'key') valuesOf(clause.key);
    if (clause.kind === 'equals') valuesOf(clause.key).add(clause.value);
    if (clause.kind === 'not') visit(clause.operand);
    if (clause.kind === 'and' || clause.kind === 'or') clause.operands.forEach(visit);
  };
  clauses.forEach(visit);
  return new Map([...candidates].map(([key, values]) => [key, [...values]]));
}

/**
 * Lists every combination of the candidate values: one context per combination.
 * @param candidates the values to try, by key
 * @returns the contexts (one empty context when there are no keys)
 */
export function combinations(candidates: ReadonlyMap<string, readonly unknown[]>): WhenContext[] {
  return [...candidates].reduce<WhenContext[]>(
    (contexts, [key, values]) => contexts.flatMap((context) => values.map((value) => ({ ...context, [key]: value }))),
    [{}],
  );
}
