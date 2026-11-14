import { DEFAULT_CONTROLS } from '../content/constants';
import { ControlsConfig, PlayerInputState } from '../sim/types';

export class InputHub {
  private heldCodes = new Set<string>();
  private justPressedCodes = new Set<string>();
  private prevGamepadJump: boolean[] = [false, false, false, false];
  private prevGamepadAbility: boolean[] = [false, false, false, false];
  private attached = false;

  // Virtual touch/on-screen control state for P1
  private virtualHeld = { left: false, right: false, down: false, upHeld: false };
  private virtualJumpQueued = false;
  private virtualAbilityQueued = false;

  private onKeyDown = (e: KeyboardEvent) => {
    if (
      e.code === 'ArrowUp' ||
      e.code === 'ArrowDown' ||
      e.code === 'ArrowLeft' ||
      e.code === 'ArrowRight' ||
      e.code === 'Space'
    ) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
        e.preventDefault();
      }
    }
    if (!this.heldCodes.has(e.code)) {
      this.justPressedCodes.add(e.code);
    }
    this.heldCodes.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.heldCodes.delete(e.code);
  };

  private onClear = () => {
    this.clearAll();
  };

  public attach() {
    if (this.attached || typeof window === 'undefined') return;
    this.attached = true;
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onClear);
    document.addEventListener('visibilitychange', this.onClear);
  }

  public detach() {
    if (!this.attached || typeof window === 'undefined') return;
    this.attached = false;
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onClear);
    document.removeEventListener('visibilitychange', this.onClear);
  }

  public clearAll() {
    this.heldCodes.clear();
    this.justPressedCodes.clear();
    this.prevGamepadJump.fill(false);
    this.prevGamepadAbility.fill(false);
    this.virtualHeld = { left: false, right: false, down: false, upHeld: false };
    this.virtualJumpQueued = false;
    this.virtualAbilityQueued = false;
  }

  public setVirtualHeld(key: 'left' | 'right' | 'down' | 'upHeld', active: boolean) {
    this.virtualHeld[key] = active;
  }

  public triggerVirtualJump() {
    this.virtualJumpQueued = true;
    this.virtualHeld.upHeld = true;
  }

  public triggerVirtualAbility() {
    this.virtualAbilityQueued = true;
  }

  public consumeJustPressedCode(code: string): boolean {
    if (this.justPressedCodes.has(code)) {
      this.justPressedCodes.delete(code);
      return true;
    }
    return false;
  }

  public endFrame() {
    this.justPressedCodes.clear();
    this.virtualJumpQueued = false;
    this.virtualAbilityQueued = false;
  }

  public readPlayerInput(
    slotIndex: number,
    singleHumanMode: boolean,
    controls: ControlsConfig = DEFAULT_CONTROLS
  ): PlayerInputState {
    const held = this.heldCodes;
    const just = this.justPressedCodes;
    const deadzone = controls.gamepadDeadzone ?? 0.25;

    let left = false;
    let right = false;
    let upHeld = false;
    let jumpPressed = false;
    let down = false;
    let abilityPressed = false;

    if (slotIndex === 0) {
      const b1 = controls.p1 ?? DEFAULT_CONTROLS.p1;
      left = held.has(b1.left) || this.virtualHeld.left;
      right = held.has(b1.right) || this.virtualHeld.right;
      upHeld =
        held.has(b1.jump) ||
        this.virtualHeld.upHeld ||
        (singleHumanMode && (held.has('Space') || held.has('ArrowUp')));
      jumpPressed =
        just.has(b1.jump) ||
        this.virtualJumpQueued ||
        (singleHumanMode && (just.has('Space') || just.has('ArrowUp')));
      down =
        held.has(b1.down) ||
        this.virtualHeld.down ||
        (singleHumanMode && held.has('ArrowDown'));
      abilityPressed =
        just.has(b1.ability) ||
        this.virtualAbilityQueued ||
        (singleHumanMode && (just.has('ShiftLeft') || just.has('KeyQ')));

      if (singleHumanMode) {
        left = left || held.has('ArrowLeft');
        right = right || held.has('ArrowRight');
      }
    } else if (slotIndex === 1) {
      const b2 = controls.p2 ?? DEFAULT_CONTROLS.p2;
      left = held.has(b2.left);
      right = held.has(b2.right);
      upHeld = held.has(b2.jump);
      jumpPressed = just.has(b2.jump);
      down = held.has(b2.down);
      abilityPressed = just.has(b2.ability);
    } else if (slotIndex === 2) {
      left = held.has('KeyJ');
      right = held.has('KeyL');
      upHeld = held.has('KeyI');
      jumpPressed = just.has('KeyI');
      down = held.has('KeyK');
      abilityPressed = just.has('KeyO');
    } else if (slotIndex === 3) {
      left = held.has('KeyF') || held.has('Numpad4');
      right = held.has('KeyH') || held.has('Numpad6');
      upHeld = held.has('KeyT') || held.has('Numpad8');
      jumpPressed = just.has('KeyT') || just.has('Numpad8');
      down = held.has('KeyG') || held.has('Numpad5');
      abilityPressed = just.has('KeyY') || just.has('Numpad9');
    }

    // Gamepad API polling for slotIndex 0..3
    if (typeof navigator !== 'undefined' && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads?.[slotIndex];
      if (pad && pad.connected) {
        const axisX = pad.axes[0] ?? 0;
        const axisY = pad.axes[1] ?? 0;
        if (axisX < -deadzone || pad.buttons[14]?.pressed) left = true;
        if (axisX > deadzone || pad.buttons[15]?.pressed) right = true;
        if (axisY > Math.max(0.4, deadzone + 0.15) || pad.buttons[13]?.pressed) down = true;

        const padJump = Boolean(
          pad.buttons[0]?.pressed ||
            pad.buttons[1]?.pressed ||
            pad.buttons[12]?.pressed ||
            axisY < -0.55
        );
        if (padJump) {
          upHeld = true;
          if (!this.prevGamepadJump[slotIndex]) {
            jumpPressed = true;
          }
        }
        this.prevGamepadJump[slotIndex] = padJump;

        const padAbility = Boolean(
          pad.buttons[2]?.pressed ||
            pad.buttons[3]?.pressed ||
            pad.buttons[5]?.pressed
        );
        if (padAbility && !this.prevGamepadAbility[slotIndex]) {
          abilityPressed = true;
        }
        this.prevGamepadAbility[slotIndex] = padAbility;
      }
    }

    return { left, right, upHeld, jumpPressed, down, abilityPressed };
  }
}
