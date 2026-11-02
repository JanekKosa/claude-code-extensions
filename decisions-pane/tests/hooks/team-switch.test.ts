/**
 * Tests of the agent team's switch: a chat switched on with /software-developer-agent, which writes the session's marker
 * `<teamState.folder>\<agentTeam.onFolder>\<session id>`, the root's `%NAME%` parts filled in, uses the team's scripts;
 * any other chat uses the `decisions` skill's. The pane shows in both. The mod looks at the marker at session start and
 * at every look of the poll.
 */
import { expect, test } from 'claude-code/testing'

import {
  CONFIG,
  HOME,
  MARKER,
  OLD_MARKER,
  ON_FOLDER,
  OPEN_FILE,
  REPO,
  SCRIPT,
  SESSION_ID,
  STANDALONE_CONFIG,
  STANDALONE_SCRIPT,
  STATE_FOLDER_SETTING,
  STATE_ROOT,
  mountPane,
  poll,
  runCommand,
  startWorld,
  switchOff,
  switchOn,
  writeOpen,
} from '../support/register-world'
import type { Engine } from 'claude-code/testing'
import type { World } from '../support/register-world'

/** The register settings of a team config a test writes. */
const REGISTER = { folder: 'decisions', openFile: 'OPEN_DECISIONS_CLAUDE.md' }

/** The root of the team's own files as the team ships it, for a team config a test writes. */
const TEAM_STATE = { folder: STATE_FOLDER_SETTING }

/** What the log holds once the pane opened by itself with one entry. */
const OPENED_ONE = 'open decisions-pane "Decisions (1)"'

/**
 * Gives a marker's path under a root, spelled as a join of the three parts.
 *
 * @param folder the folder setting
 * @param id the session id
 * @param root the root, filled in; the tests' root under USERPROFILE by default
 * @returns the path
 */
const markerAt = (folder: string, id: string, root = STATE_ROOT) => `${root}\\${folder}\\${id}`

/**
 * Writes the team's settings with this root and the usual switch folder.
 *
 * @param world the stand-ins
 * @param folder the `teamState.folder` setting, as written in the file
 */
const writeRoot = (world: World, folder: unknown) =>
  world.files.set(CONFIG, JSON.stringify({ teamState: { folder }, register: REGISTER, agentTeam: { onFolder: ON_FOLDER } }))

/**
 * Lists the paths the mod asked about other than the two settings files and the session's repo: outside a team chat by
 * its id, its switch folder setting or its root, the mod looks for no marker at all. (The test kit hands the stand-ins
 * each path resolved and normalised, so a marker planted at a raw path such as `...\team-on\..` would never be found:
 * what the mod asks for is the reliable sign.)
 *
 * @param world the stand-ins
 * @returns those paths, in order
 */
const beyondSettings = (world: World) =>
  world.accesses.filter(path => path !== CONFIG && path !== STANDALONE_CONFIG && !path.startsWith(`${REPO}\\`))

/**
 * Answers an entry in the pane and tells which script recorded the answer: that is whose scripts the chat uses.
 *
 * @param $ the test's engine
 * @param world the stand-ins
 * @param id the entry to answer
 * @returns the script's path
 */
const answeringScript = async ($: Engine, world: World, id = 'D-12') => {
  const ui = await mountPane($)

  await ui.press({ key: `submit:${REPO}::${id}` })
  await ui.unmount()

  return world.programs[world.programs.length - 1]?.[1]
}

// ── Team chat or not ──

test('S1 in a chat not switched on for the team, waiting decisions open the pane and answers use the skill\'s script', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    writeOpen(w, [{ id: 'D-12' }])
  })

  await poll(world)

  expect(world.log).toEqual([OPENED_ONE])
  expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
})

test('S1b without the agent team on the machine at all, the pane still shows', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    w.files.delete(CONFIG)
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(world.log).toEqual([OPENED_ONE])
})

test('S2 in a team chat the pane opens as before, the marker looked at before the register', async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))

  expect(world.log).toEqual([OPENED_ONE])
  expect(world.accesses.indexOf(MARKER)).toBeGreaterThanOrEqual(0)
  expect(world.accesses.indexOf(MARKER)).toBeLessThan(world.accesses.indexOf(OPEN_FILE))
  expect(await answeringScript($, world)).toBe(SCRIPT)
})

test('S3 a marker written after the chat started makes it a team chat at the next look, without a reload', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    writeOpen(w, [{ id: 'D-12' }])
  })

  switchOn(world)
  await poll(world)

  expect(await answeringScript($, world)).toBe(SCRIPT)
})

// ── What counts as outside the team ──

/** Session ids that count as outside the team. */
const UNSAFE_IDS: readonly (readonly [string, unknown])[] = [
  ['missing', undefined],
  ['not a string', 42],
  ['empty', ''],
  ['a dot', '.'],
  ['two dots', '..'],
  ['a backslash', 'a\\b'],
  ['a slash', 'a/b'],
  ['129 characters long', 'a'.repeat(129)],
  ['a space', 'a b'],
  ['a drive letter', 'C:'],
  ['an underscore', 'a_b'],
  ['a trailing line break', 'ab\n'],
]

for (const [label, id] of UNSAFE_IDS) {
  test(`S4 a session id that is ${label} counts as outside the team, and no marker is looked for`, async ($, on) => {
    const world = await startWorld($, on, w => {
      w.sessionId = id
      writeOpen(w, [{ id: 'D-12' }])
    })

    await poll(world)

    expect(beyondSettings(world)).toEqual([])
    expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
  })
}

test('S4b a session id of 128 letters, digits and dashes counts as a team chat', async ($, on) => {
  const id = `${'a1-'.repeat(42)}ab`
  const world = await startWorld($, on, w => {
    switchOff(w)
    w.sessionId = id
    w.files.set(markerAt(ON_FOLDER, id), 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(id).toHaveLength(128)
  expect(await answeringScript($, world)).toBe(SCRIPT)
})

/**
 * Team settings whose switch folder counts as outside the team, each with the first rule of the team's it breaks; the marker under
 * the usual folder stays, as a fallback would find it.
 */
const UNSAFE_FOLDERS: readonly (readonly [string, Readonly<Record<string, unknown>>])[] = [
  ['missing, with no agentTeam settings', {}],
  ['missing', { agentTeam: {} }],
  ['not a string', { agentTeam: { onFolder: 42 } }],
  ['empty', { agentTeam: { onFolder: '' } }],
  ['a drive', { agentTeam: { onFolder: 'C:' } }],
  ['a drive and a folder', { agentTeam: { onFolder: 'C:\\team-on' } }],
  ['a colon inside', { agentTeam: { onFolder: 'team:on' } }],
  ['a leading backslash', { agentTeam: { onFolder: '\\team-on' } }],
  ['a trailing backslash', { agentTeam: { onFolder: 'team-on\\' } }],
  ['a leading slash', { agentTeam: { onFolder: '/team-on' } }],
  ['a slash', { agentTeam: { onFolder: 'team/on' } }],
  ['a star', { agentTeam: { onFolder: 'team*' } }],
  ['a question mark', { agentTeam: { onFolder: 'team?' } }],
  ['angle brackets', { agentTeam: { onFolder: '<team>' } }],
  ['a bar', { agentTeam: { onFolder: 'team|on' } }],
  ['quoted', { agentTeam: { onFolder: '"team"' } }],
  ['a variable', { agentTeam: { onFolder: '%TEMP%\\team-on' } }],
  ['a percent sign', { agentTeam: { onFolder: 'team%on' } }],
  ['an empty part', { agentTeam: { onFolder: 'state\\\\team-on' } }],
  ['a dot', { agentTeam: { onFolder: '.' } }],
  ['two dots', { agentTeam: { onFolder: '..' } }],
  ['a dot part', { agentTeam: { onFolder: 'state\\.\\team-on' } }],
  ['a two-dot part', { agentTeam: { onFolder: 'state\\..\\team-on' } }],
]

for (const [label, settings] of UNSAFE_FOLDERS) {
  test(`S5 a switch folder setting that is ${label} counts as outside the team, and no marker is looked for`, async ($, on) => {
    const world = await startWorld($, on, w => {
      w.files.set(CONFIG, JSON.stringify({ teamState: TEAM_STATE, register: REGISTER, ...settings }))
      writeOpen(w, [{ id: 'D-12' }])
    })

    await poll(world)

    expect(beyondSettings(world)).toEqual([])
    expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
  })
}

test('S5b a switch folder with a space and dots in its name counts as a team chat', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    w.files.set(CONFIG, JSON.stringify({ teamState: TEAM_STATE, register: REGISTER, agentTeam: { onFolder: 'team on.v2' } }))
    w.files.set(markerAt('team on.v2', SESSION_ID), 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(await answeringScript($, world)).toBe(SCRIPT)
})

test('S5c a switch folder of several parts joined by backslashes counts as a team chat', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    w.files.set(CONFIG, JSON.stringify({ teamState: TEAM_STATE, register: REGISTER, agentTeam: { onFolder: 'switch\\team on' } }))
    w.files.set(markerAt('switch\\team on', SESSION_ID), 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(await answeringScript($, world)).toBe(SCRIPT)
})

// ── The root of the team's own files ──

test('S6 a marker only at the old place under TEMP counts as outside the team, and the old place is never looked at', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    w.files.set(OLD_MARKER, 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  await poll(world)

  expect(world.accesses).toContain(MARKER)
  expect(world.accesses).not.toContain(OLD_MARKER)
  expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
})

test('S6b team settings with no root (the shape before the team moved its files) count as outside the team, even with the old marker', async ($, on) => {
  const world = await startWorld($, on, w => {
    w.files.set(CONFIG, JSON.stringify({ register: REGISTER, agentTeam: { onFolder: 'claude-agent-team-on' } }))
    w.files.set(OLD_MARKER, 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  await poll(world)

  expect(beyondSettings(world)).toEqual([])
  expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
})

test('S6c a root naming a variable that is not set counts as outside the team, and no marker is looked for', async ($, on) => {
  const world = await startWorld($, on, w => {
    // HOME still finds the team's settings; only the root's %USERPROFILE% is missing.
    w.env.delete('USERPROFILE')
    w.env.set('HOME', HOME)
    writeOpen(w, [{ id: 'D-12' }])
  })

  await poll(world)

  expect(beyondSettings(world)).toEqual([])
  expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
})

/**
 * Sets the variables a test names, over the world's own; a variable given as undefined is unset.
 *
 * @param world the stand-ins
 * @param variables each variable's name and value
 */
const setVariables = (world: World, variables: Readonly<Record<string, string | undefined>>) =>
  Object.entries(variables).forEach(([name, value]) => (value === undefined ? world.env.delete(name) : world.env.set(name, value)))

/**
 * Roots that count as outside the team: each gives no absolute path once filled in, or names a variable the pane cannot fill in
 * (unset or empty, or not one of USERPROFILE, TEMP, TMP, LOCALAPPDATA and APPDATA: the engine lets a mod read only
 * the variables its code names). The world sets USERPROFILE, TEMP, TMP and SystemRoot.
 */
const UNSAFE_ROOTS: readonly (readonly [string, unknown, Readonly<Record<string, string | undefined>>])[] = [
  ['not text', 42, {}],
  ['empty', '', {}],
  ['relative', 'state\\team', {}],
  ['rooted without a drive', '\\state', {}],
  ['a share (UNC)', '\\\\server\\share\\state', {}],
  ['a drive without a backslash', 'C:state', {}],
  ['a drive and a slash', 'C:/state', {}],
  ['an unset variable in the middle', 'C:\\state\\%STATE_DIR%', {}],
  ['naming PROGRAMDATA, a variable the pane does not fill in, though set', '%PROGRAMDATA%\\state', { PROGRAMDATA: 'C:\\ProgramData' }],
  ['naming SystemRoot, a variable the pane does not fill in, though set', '%SystemRoot%\\state', {}],
  ['naming TEMP while TEMP is not set', '%TEMP%\\x', { TEMP: undefined }],
  ['naming TMP in the middle while TMP is not set', 'C:\\state\\%TMP%', { TMP: undefined }],
  ['naming APPDATA in the middle while APPDATA is set to nothing', 'C:\\state\\%APPDATA%', { APPDATA: '' }],
  ['naming LOCALAPPDATA while LOCALAPPDATA is not set', '%LOCALAPPDATA%\\x', { LOCALAPPDATA: undefined }],
  ['naming USERPROFILE with a dotless i, which Windows does not match', '%USERPROF\u0131LE%\\x', {}],
]

for (const [label, folder, variables] of UNSAFE_ROOTS) {
  test(`S6d a root that is ${label} counts as outside the team, and no marker is looked for`, async ($, on) => {
    const world = await startWorld($, on, w => {
      writeRoot(w, folder)
      setVariables(w, variables)
      writeOpen(w, [{ id: 'D-12' }])
    })

    await poll(world)

    expect(beyondSettings(world)).toEqual([])
    expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
  })
}

test('S6e a root written as an absolute path with a trailing backslash counts as a team chat', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    writeRoot(w, 'D:\\team state\\')
    w.files.set(markerAt(ON_FOLDER, SESSION_ID, 'D:\\team state'), 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(await answeringScript($, world)).toBe(SCRIPT)
})

test('S6f a drive root as the root keeps one backslash', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    writeRoot(w, 'C:\\')
    w.files.set(`C:\\${ON_FOLDER}\\${SESSION_ID}`, 'x')
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(await answeringScript($, world)).toBe(SCRIPT)
})

/** The five folder variables the pane fills in, each set to a folder of its own so that no two can stand in for each other. */
const FOLDER_VARIABLES = {
  USERPROFILE: HOME,
  TEMP: `${HOME}\\AppData\\Local\\Temp`,
  TMP: 'D:\\tmp',
  LOCALAPPDATA: `${HOME}\\AppData\\Local`,
  APPDATA: `${HOME}\\AppData\\Roaming`,
}

/** Roots naming one of the five, in any letter case, each with the root it gives once filled in. */
const FOLDER_ROOTS: readonly (readonly [string, string])[] = [
  ['%TEMP%\\software-developer-agent', `${HOME}\\AppData\\Local\\Temp\\software-developer-agent`],
  ['%LocalAppData%\\x', `${HOME}\\AppData\\Local\\x`],
  ['%APPDATA%\\x', `${HOME}\\AppData\\Roaming\\x`],
  ['%TMP%\\x', 'D:\\tmp\\x'],
  ['%USERPROFILE%\\x', `${HOME}\\x`],
  ['%temp%\\x', `${HOME}\\AppData\\Local\\Temp\\x`],
  ['%userprofile%\\.claude\\state\\software-developer-agent', STATE_ROOT],
]

for (const [folder, root] of FOLDER_ROOTS) {
  test(`S6g a root of ${folder} counts as a team chat, the marker looked for under ${root}`, async ($, on) => {
    const world = await startWorld($, on, w => {
      switchOff(w)
      writeRoot(w, folder)
      setVariables(w, FOLDER_VARIABLES)
      w.files.set(markerAt(ON_FOLDER, SESSION_ID, root), 'x')
      writeOpen(w, [{ id: 'D-12' }])
    })

    expect(await answeringScript($, world)).toBe(SCRIPT)
  })
}

// ── A look that fails, and a marker that goes ──

test('S8 a marker check refused keeps the pane and its reads; the next look is fine', async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))

  world.failStats.set(MARKER, 1)
  writeOpen(world, [{ id: 'D-12' }, { id: 'D-13' }])
  await poll(world)

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (2)')

  await poll(world)

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (2)')
  expect(world.log.filter(line => line.startsWith('close '))).toEqual([])
})

test('S8b a refused read of the team settings keeps the pane', async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))

  world.failReads.set(CONFIG, 1)
  writeOpen(world, [{ id: 'D-12' }, { id: 'D-13' }])
  await poll(world)

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (2)')
  expect(world.log.filter(line => line.startsWith('close '))).toEqual([])
})

test('S8c a session id that cannot be read keeps the pane', async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))

  world.failSessionIds = 1
  writeOpen(world, [{ id: 'D-12' }, { id: 'D-13' }])
  await poll(world)

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (2)')
  expect(world.log.filter(line => line.startsWith('close '))).toEqual([])
})

test('S8d team settings caught half written (not JSON) keep the pane; the next look is fine', async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))
  const settings = world.files.get(CONFIG) ?? ''

  world.files.set(CONFIG, settings.slice(0, 20))
  await poll(world)

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (1)')

  world.files.set(CONFIG, settings)
  await poll(world)

  expect(world.openPanes.get('decisions-pane')).toBe('Decisions (1)')
  expect(world.log.filter(line => line.startsWith('close '))).toEqual([])
})

test('S8e a look that fails keeps the mode until a look can tell', async ($, on) => {
  const world = await startWorld($, on, w => {
    switchOff(w)
    writeOpen(w, [{ id: 'D-12' }, { id: 'D-13' }])
  })

  switchOn(world)
  world.failReads.set(CONFIG, 1)
  await poll(world)

  expect(await answeringScript($, world, 'D-12')).toBe(STANDALONE_SCRIPT)

  await poll(world)

  expect(await answeringScript($, world, 'D-13')).toBe(SCRIPT)
})

test('S9 a marker removed leaves the pane open, and answers then use the skill\'s script', async ($, on) => {
  const world = await startWorld($, on, w => writeOpen(w, [{ id: 'D-12' }]))

  switchOff(world)
  await poll(world)

  expect(world.log).toEqual([OPENED_ONE])
  expect(await answeringScript($, world)).toBe(STANDALONE_SCRIPT)
})

// ── The command ──

test('S10 the command works outside the team too', async ($, on) => {
  await startWorld($, on, w => {
    switchOff(w)
    writeOpen(w, [{ id: 'D-12' }])
  })

  expect(await runCommand($)).toMatchObject({ text: 'Decisions pane hidden.' })
  expect(await runCommand($)).toMatchObject({ text: 'Decisions pane shown.' })
})
