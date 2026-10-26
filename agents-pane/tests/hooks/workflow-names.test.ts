/**
 * Tests of hooks/workflow-names.ts: a Workflow call's name.
 */
import { expect, test } from 'claude-code/testing'

import { workflowNameOf } from '../../hooks/workflow-names'

test('W1 a workflow is named by its script meta, else its saved name, else its script file', () => {
  expect(workflowNameOf({ script: 'export const meta = {\n  name: "review-changes",\n}' })).toBe('review-changes')
  expect(workflowNameOf({ name: 'nightly-check' })).toBe('nightly-check')
  expect(workflowNameOf({ scriptPath: 'C:\\s\\wf\\fan-out.js' })).toBe('fan-out')
  expect(workflowNameOf({})).toBe('workflow')
})
