/**
 * Naming a Workflow call by the name its script's `meta` gives it.
 */
import { baseName } from '../utils/text'

/** The tool whose calls start a workflow run. */
export const WORKFLOW_TOOL = 'Workflow'

/** What a Workflow call is named when nothing in its input names it. */
const UNNAMED_WORKFLOW = 'workflow'

/** `export const meta = { name: '...' }` in a workflow script: the first `name:` with a quoted value. */
const META_NAME = /\bname\s*:\s*(['"`])([^'"`\r\n]+)\1/

/**
 * Names a Workflow call: the `name` its inline script's `meta` gives, else the saved workflow's name, else its
 * script file's name.
 *
 * @param input the Workflow call's input
 * @returns the workflow's name; `workflow` when nothing names it
 */
export function workflowNameOf(input: Readonly<Record<string, unknown>>): string {
  const script = typeof input.script === 'string' ? input.script : ''
  const fromMeta = META_NAME.exec(script)?.[2]

  if (fromMeta !== undefined) {
    return fromMeta
  }

  if (typeof input.name === 'string' && input.name.length > 0) {
    return input.name
  }

  if (typeof input.scriptPath === 'string' && input.scriptPath.length > 0) {
    return baseName(input.scriptPath).replace(/\.[^.]+$/, '')
  }

  return UNNAMED_WORKFLOW
}
