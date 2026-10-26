/**
 * The agents-pane mod's contract: the `$.state` values it owns.
 *
 * `agents` is every agent of the session the mod has seen start, oldest first; the agent hooks write it and the pane
 * reads it. `workflows` names each Workflow call by its tool_use id, so a workflow's agents are grouped under their
 * workflow's name. `now` is the clock the running times are drawn against, written while an agent runs. `toggled`
 * lists the workflow groups the person folded or opened against their default. `dismissed` is true once the person
 * closed the pane, so it is not opened again by itself. The contract imports nothing (validate refuses an import):
 * `Shaped` is named inside the augmentation of 'claude-code'.
 */

/** Where an agent stands: running a turn, idle between turns (a teammate), or ended. */
export type AgentState = 'running' | 'idle' | 'done' | 'failed' | 'stopped'

/** One agent of the session, as the pane lists it. */
export type AgentRow = {
  /** The agent's id, as `agent.spawn` answers it and its loop's events carry it. */
  readonly id: string
  /** What the agent is doing, in a few words: the call's description, else its name. */
  readonly label: string
  /** The agent type it was spawned as (`Explore`, `general-purpose`, `fork`, ...); its name when it has no label. */
  readonly type: string
  /** The model it runs on, as the engine resolved it. */
  readonly model: string
  /** The reasoning effort of its latest model request (`high`, `xhigh`, ...); null before its first request. */
  readonly effort: string | null
  /** The tokens its context held after its latest model request; null before its first request. */
  readonly contextTokens: number | null
  /** The agent whose loop spawned it; null when the main conversation did. */
  readonly parentId: string | null
  /** The workflow run it belongs to (the Workflow call's tool_use id, else the run id); null outside a workflow. */
  readonly workflowKey: string | null
  /** True for a teammate, which goes idle between turns instead of ending. */
  readonly isTeammate: boolean
  readonly state: AgentState
  /** When it started (or was last resumed), in milliseconds since the epoch. */
  readonly startedAt: number
  /** When its last turn ended; null while it runs. */
  readonly endedAt: number | null
}

/** One Workflow call: its tool_use id and the name its script's `meta` gives it. */
export type WorkflowRow = {
  readonly key: string
  readonly name: string
}

declare module 'claude-code' {
  interface PluginState {
    'agents-pane': {
      agents: Shaped<AgentRow[]>
      workflows: Shaped<WorkflowRow[]>
      now: number
      toggled: string[]
      dismissed: boolean
    }
  }
}
