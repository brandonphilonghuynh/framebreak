import { neutralInput, type Input } from "./simulation";
const supported = new Set([
  "KeyA",
  "KeyD",
  "KeyW",
  "KeyS",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Space",
  "KeyJ",
  "KeyK",
  "KeyL",
  "KeyI",
  "KeyE",
  "ShiftLeft",
  "ShiftRight",
]);
export class PlayerControls {
  private held = new Set<string>();
  private buffered = new Map<string, number>();
  enabled = false;
  constructor() {
    window.addEventListener("keydown", (e) => {
      if (
        !this.enabled ||
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        !supported.has(e.code)
      )
        return;
      e.preventDefault();
      this.set(e.code, true);
    });
    window.addEventListener("keyup", (e) => this.set(e.code, false));
    window.addEventListener("blur", () => this.clear());
  }
  set(code: string, pressed: boolean) {
    if (pressed && this.enabled) {
      this.held.add(code);
      this.buffered.set(code, performance.now() + 85);
    } else this.held.delete(code);
  }
  clear() {
    this.held.clear();
    this.buffered.clear();
  }
  read(): Input {
    if (!this.enabled) return neutralInput();
    const has = (...keys: string[]) =>
      keys.some(
        (k) =>
          this.held.has(k) || (this.buffered.get(k) ?? 0) > performance.now(),
      );
    return {
      move:
        Number(has("KeyD", "ArrowRight")) - Number(has("KeyA", "ArrowLeft")),
      jump: has("Space", "KeyW", "ArrowUp"),
      down: has("KeyS", "ArrowDown"),
      up: has("KeyW", "ArrowUp"),
      attack: has("KeyJ"),
      special: has("KeyK"),
      guard: has("KeyL"),
      dodge: has("ShiftLeft", "ShiftRight"),
      ultimate: has("KeyI"),
      pickup: has("KeyE"),
    };
  }
}
