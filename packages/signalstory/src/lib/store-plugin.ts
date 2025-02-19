/* eslint-disable @typescript-eslint/no-explicit-any */
import { Store } from './store';
import { StoreEffect } from './store-effect';

/**
 * Represents the type of the state held by a store.
 *
 * This utility type extracts the state type from a generic store type.
 *
 * @typeparam TStore - The generic store type.
 * @returns The type of state held by the store.
 */
export type StoreState<TStore> = TStore extends Store<infer TState>
  ? TState
  : never;

/**
 * Represents a function that processes initialization of a store.
 *
 * This type defines a function that is called during the initialization of a store.
 *
 * @param store - The store being initialized.
 */
export type InitPostprocessor = (store: Store<any>) => void;

/**
 * Represents a function that preprocesses a command before execution.
 *
 * This type defines a function that is called before a command is executed on a store.
 *
 * @param store - The store on which the command is being executed.
 * @param command - The command being executed, if applicable.
 */
export type CommandPreprocessor = (
  store: Store<any>,
  command: string | undefined
) => void;

/**
 * Represents a function that postprocesses a command after execution.
 *
 * This type defines a function that is called after a command has been executed on a store.
 *
 * @param store - The store on which the command was executed.
 * @param command - The command that was executed, if applicable.
 */
export type CommandPostprocessor = (
  store: Store<any>,
  command: string | undefined
) => void;

/**
 * Represents a function that preprocesses an effect before execution.
 *
 * This type defines a function that is called before an effect is executed on a store.
 *
 * @typeparam TStore - The generic store type.
 * @typeparam TResult - The result type of the effect function.
 * @param store - The store on which the effect is being executed.
 * @param effect - The effect being executed.
 */
export type EffectPreprocessor = (
  store: Store<any>,
  effect: StoreEffect<any, any, any>
) => void;

/**
 * Represents a function that postprocesses an effect after execution.
 *
 * This type defines a function that is called after an effect has been executed on a store.
 *
 * @typeparam TStore - The generic store type.
 * @typeparam TResult - The result type of the effect function.
 * @param store - The store on which the effect was executed.
 * @param effect - The effect that was executed.
 * @param result - The result value from the effect function.
 */
export type EffectPostprocessor<TResult> = (
  store: Store<any>,
  effect: StoreEffect<any, any, TResult>,
  result: TResult
) => TResult;

/**
 * Represents a plugin that can be attached to a store to modify its behavior.
 *
 * This type defines the structure of a store plugin, which can include various
 * functions for initialization, command preprocessing, and command postprocessing.
 *
 * @property [precedence] - Influcences the ordering of the plugin, high precendence indicates early usage
 * @property [init] - A function for initializing the store.
 * @property [preprocessCommand] - A function for preprocessing commands.
 * @property [postprocessCommand] - A function for postprocessing commands.
 * @property [preprocessEffect] - A function for preprocessing effects.
 * @property [postprocessEffect] - A function for postprocessing effects.
 * @property [others] - Additional properties may be added for plugin-specific functionality.
 */
export type StorePlugin = {
  precedence?: number;
  init?: InitPostprocessor;
  preprocessCommand?: CommandPreprocessor;
  postprocessCommand?: CommandPostprocessor;
  preprocessEffect?: EffectPreprocessor;
  postprocessEffect?: EffectPostprocessor<any>;
  [others: string]: any;
};
