/* tslint:disable */
/* eslint-disable */
export class LifeAxiom0 {
  free(): void;
  constructor();
  readonly description: string;
}
export class LifePulse {
  free(): void;
  constructor(initial_user_data: string);
  increment_activation_count(): void;
  readonly axiomDescription: string;
  userData: string;
  readonly activationCount: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_lifeaxiom0_free: (a: number, b: number) => void;
  readonly lifeaxiom0_new: () => number;
  readonly lifeaxiom0_description: (a: number, b: number) => void;
  readonly __wbg_lifepulse_free: (a: number, b: number) => void;
  readonly lifepulse_new: (a: number, b: number) => number;
  readonly lifepulse_get_axiom_description: (a: number, b: number) => void;
  readonly lifepulse_get_user_data: (a: number, b: number) => void;
  readonly lifepulse_set_user_data: (a: number, b: number, c: number) => void;
  readonly lifepulse_increment_activation_count: (a: number) => void;
  readonly lifepulse_get_activation_count: (a: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
