/**
 * Gamepad navigation for the launcher.
 *
 * Handhelds expose their D-Pad/buttons as a standard-mapped gamepad; the
 * launcher routes them through the same `[data-kb]` focus order as the
 * keyboard, so both inputs behave identically. Analog stick input is converted
 * to discrete steps with hysteresis so one push moves one control.
 */

export type GamepadCommand = 'next' | 'previous' | 'activate' | 'back';

export interface GamepadOptions {
  onCommand: (command: GamepadCommand) => void;
  /** Repeat interval while a direction is held. */
  repeatMs?: number;
  /** Delay before a held direction starts repeating. */
  holdMs?: number;
}

interface AxisState {
  active: boolean;
  nextEmitAt: number;
}

interface PadState {
  vertical: AxisState;
  buttons: boolean[];
}

const AXIS_PRESS = 0.6;

// W3C standard mapping: 12/13 = D-Pad up/down, 0 = A, 1 = B, 9 = Start.
const BUTTON_ACTIVATE = 0;
const BUTTON_BACK = 1;
const BUTTON_START = 9;

const clearAxis = (state: AxisState) => {
  state.active = false;
  state.nextEmitAt = 0;
};

export function attachGamepad({onCommand, repeatMs = 180, holdMs = 320}: GamepadOptions): () => void {
  const pads = new Map<string, PadState>();
  let frame = 0;

  const readPad = (pad: Gamepad): PadState => {
    const key = String(pad.index);
    const existing = pads.get(key);
    if (existing) return existing;
    const created: PadState = {vertical: {active: false, nextEmitAt: 0}, buttons: []};
    pads.set(key, created);
    return created;
  };

  const step = (state: AxisState, direction: number, now: number) => {
    if (!state.active) {
      state.active = true;
      state.nextEmitAt = now + holdMs;
      onCommand(direction > 0 ? 'next' : 'previous');
      return;
    }
    if (now >= state.nextEmitAt) {
      state.nextEmitAt = now + repeatMs;
      onCommand(direction > 0 ? 'next' : 'previous');
    }
  };

  const tick = (now: number) => {
    frame = requestAnimationFrame(tick);
    const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    for (const pad of gamepads) {
      if (!pad?.connected) continue;
      const state = readPad(pad);

      const down = pad.buttons[13]?.pressed ? 1 : 0;
      const up = pad.buttons[12]?.pressed ? 1 : 0;
      const stick = pad.axes[1] ?? 0;
      const direction = down === 1 || stick > AXIS_PRESS
        ? 1
        : up === 1 || stick < -AXIS_PRESS
          ? -1
          : 0;
      if (direction === 0) clearAxis(state.vertical);
      else step(state.vertical, direction, now);

      const bindings: ReadonlyArray<readonly [number, GamepadCommand]> = [
        [BUTTON_ACTIVATE, 'activate'],
        [BUTTON_BACK, 'back'],
        [BUTTON_START, 'activate'],
      ];
      for (const [index, command] of bindings) {
        const pressed = Boolean(pad.buttons[index]?.pressed);
        if (pressed && !state.buttons[index]) onCommand(command);
        state.buttons[index] = pressed;
      }
    }
  };

  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    pads.clear();
  };
}
