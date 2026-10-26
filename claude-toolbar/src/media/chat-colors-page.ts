/**
 * The script of the Chat colors page. It runs in the webview (a browser page), not in Node: tsconfig.webview.json
 * compiles it into the media folder, and the page loads it as a module after iro.js. It builds one iro.js color wheel
 * with a lightness slider, and keeps the switch, the wheel and the hex field in step with the state the extension
 * sends. The switch picks the part the wheel sets; each of its buttons shows that part's color, or "theme default".
 * The wheel shows the selected part's color: the user's, else the one the chat shows now (VS Code gives the page every
 * theme color as a CSS variable, and the page reads them again whenever VS Code changes them). It saves a color when
 * the user lets go of the wheel (iro.js's input:end), when the hex field was changed and loses focus or Enter is
 * pressed, and removes it at once on Default. The selected part is kept in the webview's state, so it survives the
 * page being rebuilt each time the pane shows again.
 */

import type iroNamespace from '@jaames/iro';
import type { ChatPart, PageMessage, PartState, StateMessage } from './chat-colors-protocol';

/** iro.js, which its own script tag loads before this script, as the global `iro`. */
declare const iro: typeof iroNamespace;

/** What the page keeps in the webview's state while VS Code rebuilds it: the part the switch selects. */
interface SavedState {
  readonly part: ChatPart;
}

/**
 * Gives the page its channel to the extension and its kept state; VS Code allows one call per page.
 * @returns the channel
 */
declare function acquireVsCodeApi(): {
  postMessage(message: PageMessage): void;
  getState(): SavedState | undefined;
  setState(state: SavedState): void;
};

/** The page's controls. */
interface Controls {
  /** The switch's buttons, one per part, in order. */
  readonly parts: readonly HTMLButtonElement[];
  /** The color wheel and its lightness slider. */
  readonly picker: iroNamespace.ColorPicker;
  /** The hex field: follows the wheel, and takes a typed color. */
  readonly hexField: HTMLInputElement;
  /** Where a typed text that is not a color is reported. */
  readonly problem: HTMLElement;
}

/** The channel to the extension. */
const extension = acquireVsCodeApi();

/** What a part's button says while the user's settings give it no color. */
const themeDefaultText = 'theme default';

/** A color the wheel takes as it is: # and six hex digits. */
const sixDigitHex = /^#[0-9a-f]{6}$/i;

/** The state the extension sent last; undefined until it sends one. */
let shownState: StateMessage | undefined;

/** The part the switch selects; the first part until the page has started. */
let selected: ChatPart = 'promptOutline';

// ---------------------------------------------------------------------------------------------------------------
// Building the page
// ---------------------------------------------------------------------------------------------------------------

/**
 * Builds the controls, selects the kept part (else the first), listens for the state and for VS Code's color
 * changes, and asks the extension for the state.
 */
function startPage(): void {
  const controls = bindControls();
  selected = extension.getState()?.part ?? partOf(controls.parts[0]);
  listen(controls);
  window.addEventListener('message', (event: MessageEvent<StateMessage>) => {
    shownState = event.data;
    showState(controls);
  });
  new MutationObserver(() => showState(controls)).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  send({ type: 'ready' });
}

/**
 * Builds the color wheel, with the lightness slider beside it, and finds the other controls.
 * @returns the controls
 */
function bindControls(): Controls {
  const wheel = element<HTMLElement>('.wheel');
  return {
    parts: [...document.querySelectorAll<HTMLButtonElement>('.part')],
    picker: iro.ColorPicker(wheel, {
      width: wheelSize(wheel),
      layoutDirection: 'horizontal',
      layout: [{ component: iro.ui.Wheel }, { component: iro.ui.Slider, options: { sliderType: 'value' } }],
    }),
    hexField: element('.hex'),
    problem: element('.problem'),
  };
}

/**
 * Makes the controls follow each other and send the saves.
 * @param controls the controls
 */
function listen(controls: Controls): void {
  const { parts, picker, hexField } = controls;
  for (const button of parts) button.addEventListener('click', () => select(controls, partOf(button)));
  picker.on('color:change', (color: iroNamespace.Color) => showHex(controls, color.hexString));
  picker.on('input:end', (color: iroNamespace.Color) => send({ type: 'save', part: selected, color: color.hexString }));
  hexField.addEventListener('change', () => send({ type: 'save', part: selected, color: hexField.value }));
  hexField.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') hexField.blur();
  });
  element<HTMLButtonElement>('.default').addEventListener('click', () => send({ type: 'useDefault', part: selected }));
}

/**
 * Selects a part on the switch, keeps it in the webview's state, and shows it.
 * @param controls the controls
 * @param part the part
 */
function select(controls: Controls, part: ChatPart): void {
  selected = part;
  extension.setState({ part });
  showState(controls);
}

// ---------------------------------------------------------------------------------------------------------------
// Showing the state
// ---------------------------------------------------------------------------------------------------------------

/**
 * Shows the last state: each part's button, the selected part's color on the wheel unless the user is moving it, and
 * the problem with a rejected text typed for the selected part.
 * @param controls the controls
 */
function showState(controls: Controls): void {
  if (shownState === undefined) return;
  for (const button of controls.parts) showPart(button, stateOf(partOf(button)));
  const button = controls.parts.find((candidate) => partOf(candidate) === selected);
  if (button !== undefined && !controls.picker.inputActive) controls.picker.color.set(wheelColor(button, stateOf(selected)));
  const rejected = shownState.rejected;
  controls.problem.textContent = rejected?.part === selected ? `"${rejected.text}" is not a color. Type # and six hex digits, such as #4FA3E0.` : '';
}

/**
 * Shows one part's button: whether it is selected, its color as the swatch, and its color's text or "theme default".
 * A part without a color of the user's gets the theme's own color, as its CSS variable names it, for its swatch.
 * @param button the part's button
 * @param state the part's state
 */
function showPart(button: HTMLButtonElement, state: PartState | undefined): void {
  const color = state?.color ?? null;
  button.setAttribute('aria-checked', String(partOf(button) === selected));
  button.style.setProperty('--swatch', color ?? `var(${button.dataset.colorVariable})`);
  part<HTMLElement>(button, '.value').textContent = color ?? themeDefaultText;
}

/**
 * Picks the color the wheel shows for a part: the user's when it is six hex digits, else the color its swatch shows
 * now (the theme's own, or a user's color in another form), as the browser computes it.
 * @param button the part's button
 * @param state the part's state
 * @returns a color iro.js reads: `#RRGGBB`, or the browser's `rgb(...)` or `rgba(...)`
 */
function wheelColor(button: HTMLButtonElement, state: PartState | undefined): string {
  const color = state?.color ?? null;
  return color !== null && sixDigitHex.test(color) ? color : getComputedStyle(part(button, '.swatch')).backgroundColor;
}

/**
 * Shows a color in the hex field, unless the user is typing in it.
 * @param controls the controls
 * @param hex the color, `#rrggbb` in either case
 */
function showHex(controls: Controls, hex: string): void {
  if (document.activeElement !== controls.hexField) controls.hexField.value = hex.toUpperCase();
}

// ---------------------------------------------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------------------------------------------

/**
 * Finds a part's state in the last state.
 * @param chatPart the part
 * @returns its state; undefined before the first state
 */
function stateOf(chatPart: ChatPart): PartState | undefined {
  return shownState?.parts.find((candidate) => candidate.part === chatPart);
}

/**
 * Reads which part a switch button is for.
 * @param button the button
 * @returns its data-part
 */
function partOf(button: HTMLButtonElement): ChatPart {
  return button.dataset.part as ChatPart;
}

/**
 * Sends a message to the extension.
 * @param message the message
 */
function send(message: PageMessage): void {
  extension.postMessage(message);
}

/**
 * Finds an element of the page.
 * @param selector its selector
 * @returns the element
 */
function element<Found extends HTMLElement>(selector: string): Found {
  return part<Found>(document.body, selector);
}

/**
 * Finds an element inside another.
 * @param parent the element to look in
 * @param selector its selector
 * @returns the element
 */
function part<Found extends HTMLElement>(parent: HTMLElement, selector: string): Found {
  const found = parent.querySelector<Found>(selector);
  if (found === null) throw new Error(`The page has no ${selector}.`);
  return found;
}

/**
 * Reads the color wheel's width from the stylesheet (its `--wheel-size`, in pixels).
 * @param wheel the wheel's element
 * @returns the width
 */
function wheelSize(wheel: HTMLElement): number {
  return Number.parseInt(getComputedStyle(wheel).getPropertyValue('--wheel-size'), 10);
}

startPage();
