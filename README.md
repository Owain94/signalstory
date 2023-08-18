<p align="center">
 <img width="30%" height="30%" src="signalstory.png">
</p>

# signalstory

**Simplify State Management, Embrace the Signal-way-of-doing**

signalstory is a flexible and powerful TypeScript library designed specifically for Angular applications. By leveraging signals, signalstory simplifies state management and greatly reduces the reliance on asynchronous observables in components and templates.It offers a range of architectural options, from simple repository-based state management to decoupled commands, side effects, and inter-store communication using an event-based approach. With signalstory, you have the freedom to choose the store implementation that best suits your needs.

## Features

- **Signal-Based State Management:** Utilizes a signal-based approach to state management, as everything, except side effects, is completely signal-based. This eliminates the need for asynchronous observables in components and templates, making the state management process more streamlined.
- **Tailored for Angular:** Is specifically tailored to Angular applications, ensuring seamless integration and optimal performance within the Angular framework.
- **Event Handling:** Supports event handling, enabling decoupled communication and interaction between different stores as well as providing the possibility to react synchronously to events.
- **Open Architecture:** Offers an open architecture, allowing you to choose between different store implementations. You can use plain repository-based stores or even Redux-like stores depending on your needs and preferences.
- **Flexible Side Effect Execution:** Side effects can be implemented in different ways in signalstory. You have the option to include side effects directly as part of the store, use service-based side effects, or execute effects imperatively on the store based on your specific requirements.
- **Automatic Persistence to Local Storage:** Provides automatic persistence of store state to local storage. Any changes made to the store are automatically synchronized with local storage, ensuring that the state is preserved across page reloads. Initialization of the store can also be directly performed from the persisted state in local storage.
- **State History:** With signalstory, you can enable store history to track state changes over time and perform undo and redo commands.
- **Immutability:** In contrast to native signals, immutability becomes a choice, safeguarding your state against accidental mutations and offering more predictability and simplified debugging.
- **Redux Devtools:** Dive deep into the history of state changes, visualize the flow of actions, and effortlessly debug your application using the Redux Devtools

## Installation

Install the library using npm:

```shell
npm install signalstory
```

## Usage

To demonstrate the usage of signalstory, let's create a very simple counter application.
Please look at the sample app for more realistic use cases.

First, let's create a `CounterStore` that extends `Store<number>`. This store will manage the counter state.

```typescript
import { Injectable } from '@angular/core';
import { Store } from 'signalstory';

@Injectable({
  providedIn: 'root',
})
export class CounterStore extends Store<number> {
  constructor() {
    super({ initialState: 0 });
  }

  increment = () => this.update(state => state + 1);

  decrement = () => this.update(state => state - 1);
}
```

Next, inject the `CounterStore` into a component.

```typescript
import { Component } from '@angular/core';
import { CounterStore } from './counter.store';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  constructor(public store: CounterStore) {}
}
```

In the corresponding HTML template (`app.component.html`), you can bind the store's state and methods to the UI elements.

```html
<p>{{ store.state() }}</p>
<button (click)="store.increment()">Increment</button>
<button (click)="store.decrement()">Decrement</button>
```

That's it! You've set up the counter application using signalstory for state management. The store keeps track of the counter value, and the buttons trigger the corresponding store methods to update the state.

Feel free to customize the example and explore other features and functionalities offered by signalstory for more complex state management scenarios in your Angular applications.

## Sample Application

To set up and run the sample app, follow the steps below:

1. Clone the repository: Clone the repository containing the signalstory library and the sample app.

2. Install dependencies: Navigate to the root directory of the repository and run the following command to install the necessary dependencies:

   ```bash
   npm install
   ```

3. Build the library: Run the following command to build the signalstory library:

   ```bash
   ng build signalstory
   ```

4. Serve the sample app: Run the following command to serve the sample app locally:

   ```bash
   ng serve sample
   ```

5. Open the app in a browser: Open your browser and navigate to `http://localhost:4200` to see the sample app running.
