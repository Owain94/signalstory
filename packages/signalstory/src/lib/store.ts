import {
  Injector,
  ProviderToken,
  Signal,
  WritableSignal,
  effect,
  inject,
  runInInjectionContext,
  signal,
} from '@angular/core';
import { Mediator } from './mediator';
import { HistoryItem, StoreHistory } from './store-history';
import { StoreEvent } from './store-event';
import { StoreEffect } from './store-effect';
import { StoreConfig } from './store-config';
import {
  clearLocalStorage,
  loadFromStorage,
  saveToStorage,
} from './store-persistence';
import { StoreQuery } from './store-query';

/**
 * The base class for signal stores, providing common functionality and access to the mediator.
 */
abstract class StoreBase {
  private static _mediator: Mediator | undefined;
  static get mediator(): Mediator {
    if (!StoreBase._mediator) {
      StoreBase._mediator = new Mediator();
    }

    return StoreBase._mediator;
  }

  protected constructor(enableEvents: boolean) {
    if (enableEvents && !StoreBase._mediator) {
      StoreBase._mediator = new Mediator();
    }
  }
}

/**
 * Represents a signal store that manages a state and provides methods for state mutation, event handling, and more.
 * @typeparam TState The type of the store's state.
 */
export class Store<TState> extends StoreBase {
  private readonly _state: WritableSignal<TState>;
  private readonly config: Required<StoreConfig<TState>>;
  private readonly history: StoreHistory<TState> | undefined;
  private readonly injector: Injector | undefined;

  /**
   * Creates a new instance of the store class.
   * @param config The configuration options for the store.
   */
  public constructor(config: StoreConfig<TState>) {
    super(config.enableEvents ?? false);
    this.config = {
      name: config.name ?? this.constructor.name,
      initialState: config.initialState,
      enableEvents: config.enableEvents ?? false,
      enableEffectsAndQueries: config.enableEffectsAndQueries ?? false,
      enableLogging: config.enableLogging ?? false,
      enableStateHistory: config.enableStateHistory ?? false,
      enableLocalStorageSync: config.enableLocalStorageSync ?? false,
    };

    if (config.enableStateHistory) {
      this.history = new StoreHistory<TState>();
    }

    if (config.enableEffectsAndQueries) {
      this.injector = inject(Injector);
    }

    if (config.enableLocalStorageSync) {
      const persistedState = loadFromStorage<TState>(this.config.name);
      this._state = signal(persistedState ?? config.initialState);
      effect(() => {
        saveToStorage(this.config.name, this._state());
      });
      this.log(
        'Init',
        persistedState
          ? 'Store initialized from local storage'
          : 'local storage is empty; store initialized using configured initial state',
        config,
        this._state()
      );
    } else {
      this._state = signal(config.initialState);
      this.log('Init', 'Store initialized', config);
    }
  }

  /**
   * Gets the signal representing the store's current state.
   */
  public get state(): Signal<TState> {
    return this._state.asReadonly();
  }

  /**
   * Gets the history of this store from creation until before current state
   */
  public getHistory(): HistoryItem<TState>[] {
    return this.history?.entries ?? [];
  }

  /**
   * Clears the persisted state from local storage.
   * Does not affect the current state of the store
   */
  public clearPersistence() {
    clearLocalStorage(this.config.name);
  }

  /**
   * Sets the store's state to the provided state, with an optional command name.
   * @param newState The new state of the store.
   * @param commandName The name of the command associated with the state change.
   */
  public set(newState: TState, commandName?: string): void {
    this.addToHistory(commandName);

    this._state.set(newState);

    this.log('Command', commandName ?? 'unspecified command', {
      newState: this.state(),
    });
  }

  /**
   * Updates the store's state based on the current state, with an optional command name.
   * @param updateFn A function that updates the current state.
   * @param commandName The name of the command associated with the state change.
   */
  public update(
    updateFn: (currentState: TState) => TState,
    commandName?: string
  ): void {
    this.addToHistory(commandName);

    this._state.update(state => updateFn(state));

    this.log('Command', commandName ?? 'unspecified command', {
      newState: this.state(),
    });
  }

  /**
   * Mutates the store's state using the provided mutator function, with an optional command name.
   * @param mutator A function that mutates the current state.
   * @param commandName The name of the command associated with the state mutation.
   */
  public mutate(mutator: (currentState: TState) => void, commandName?: string) {
    this.addToHistory(commandName);

    this._state.mutate(mutator);

    this.log('Command', commandName ?? 'unspecified command', {
      newState: this.state(),
    });
  }

  /**
   * Registers a handler for the specified event in the store's mediator.
   * @param event The event to register the handler for.
   * @param handler The handler function to be executed when the event is published.
   * @param withReplay Specifies whether to replay events upon registration. Default value is false.
   */
  public registerHandler<T>(
    event: StoreEvent<T>,
    handler: (event: StoreEvent<T>) => void,
    withReplay: boolean = false
  ) {
    const source = this.config.name;

    Store.mediator.register<T>(event, source, handler);

    if (withReplay) {
      Store.mediator.replay(source);
    }

    this.log('Init', `Register handler for event ${event.name}`);
  }

  /**
   * Publishes an event to the mediator, executing all associated event handlers.
   * @param event The event to publish.
   * @param payload The payload to pass to the event handlers.
   */
  public publish(event: StoreEvent<never>, payload?: undefined): void;
  public publish<T>(event: StoreEvent<T>, payload: T): void;
  public publish<T>(event: StoreEvent<T>, payload?: T): void {
    if (this.config.enableLogging) {
      this.log('Event', `Publish event ${event.name}`);
    }

    const executedHandlerSources = Store.mediator.publish(event, payload);

    for (const handlerSource of executedHandlerSources) {
      this.logWithGeneralStore(handlerSource, 'Handler', `Handled Event`, {
        name: event.name,
        payload: payload,
      });
    }
  }

  /**
   * Runs an effect with the provided arguments and returns the result.
   * The effect may be associated with the store itself but it may also be unrelated
   * @typeparam TArgs The types of the effect's arguments.
   * @typeparam TResult The type of the effect's result.
   * @param effect The store effect to run.
   * @param args The arguments to pass to the effect.
   * @returns The result of the effect.
   */
  public runEffect<TArgs extends any[], TResult>(
    effect: StoreEffect<TState, TArgs, TResult>,
    ...args: TArgs
  ): TResult {
    this.log('Effect', `Running ${effect.name}`, effect, ...args);

    if (effect.withInjectionContext && this.injector) {
      return runInInjectionContext(this.injector, () => {
        return effect.func(this, ...args);
      });
    } else {
      return effect.func(this, ...args);
    }
  }

  public runQuery<
    TResult,
    TStores extends ProviderToken<any>[],
    TArgs = undefined
  >(
    storeQuery: StoreQuery<TResult, TStores, TArgs>,
    ...args: TArgs extends undefined ? [] : [TArgs]
  ) {
    return runInInjectionContext(this.injector!, () => {
      const queryArgs = [
        ...(storeQuery.stores.map(x => inject(x)) as {
          [K in keyof TStores]: TStores[K] extends ProviderToken<infer U>
            ? U
            : never;
        }),
        ...(args as any[]),
      ];

      return storeQuery.query(...(queryArgs as any));
    });
  }

  /**
   * Performs an undo action by reverting the state to the previous state in the history.
   */
  public undo() {
    if (!this.history) {
      this.log(
        'Undo',
        'Attempted to perform an undo action, but enableStateHistory is not active',
        this.config
      );
    } else {
      const newState = this.history.undo(this.state());
      if (newState) {
        this.log('Undo', 'Performed an undo action');
        this._state.set(newState);
      } else {
        this.log(
          'Undo',
          'Attempted to perform an undo action but the state history is empty'
        );
      }
    }
  }

  /**
   * Performs a redo action by applying the last state in the history before the prior undo action.
   */
  public redo() {
    if (!this.history) {
      this.log(
        'Redo',
        'Attempted to perform a redo action, but enableStateHistory is not active',
        this.config
      );
    } else {
      const newState = this.history.redo(this.state());
      if (newState) {
        this._state.set(newState);
        this.log('Redo', 'Performed a redo action', this.state());
      } else {
        this.log(
          'Redo',
          'Attempted to perform a redo action, but the prior action was not an undo action',
          this.state()
        );
      }
    }
  }

  /**
   * Logs a message with the store's context and action.
   * @param context The context of the log message (e.g., 'Init', 'Command', 'Event').
   * @param action The action being logged.
   * @param optionalParams Optional additional parameters to log.
   */
  private log(context: string, action: string, ...optionalParams: any[]) {
    this.logWithGeneralStore(
      this.config.name,
      context,
      action,
      ...optionalParams
    );
  }

  /**
   * Logs a message with the store's context and action, including a general store name.
   * @param store The name of the store.
   * @param context The context of the log message (e.g., 'Init', 'Command', 'Event').
   * @param action The action being logged.
   * @param optionalParams Optional additional parameters to log.
   */
  private logWithGeneralStore(
    store: string,
    context: string,
    action: string,
    ...optionalParams: any[]
  ) {
    if (this.config.enableLogging) {
      console.log(`[${store}->${context}] ${action}`, ...optionalParams);
    }
  }

  /**
   * Adds the current state to the history with the specified command name.
   * @param currentCommandName The name of the current command associated with the state change.
   */
  private addToHistory(currentCommandName: string | undefined) {
    if (this.history) {
      this.history.add(this.state(), currentCommandName ?? 'Unspecified');
    }
  }
}
