# React Use Action Cable
Hooks to use Rails Action Cable in your React (Native) application.

## Installation
```bash
npm install @aersoftware/react-use-action-cable --save
```

## Usage

### Connecting to a websocket
To connect to an Action Cable, simply call the useActionCable hook with the URL you wish to connect to. If you want to be able to use this Action Cable throughout your application consider implementing it in a [context](https://reactjs.org/docs/context.html).
```js
import React, { useEffect } from 'react';
import { useActionCable, useChannel } from '@aersoftware/react-use-action-cable';

export default function index() {
  const { actionCable } = useActionCable('ws://localhost:3000/cable');
}
```

### Subscribe to a channel
Provide the useChannel hook with the previously created `actionCable`. You then get access to the (un)subscribe and send functions. In the example below we immediately subscribe to the channel 'ChannelName' on the first render.
```js
...
  const { subscribe, unsubscribe, send } = useChannel(actionCable)

  useEffect(() => {
    subscribe({
      channel: 'ChannelName',
      param2: '...',
      param3: '...'
    }, {
      received: (data) => console.log(data),
      // Custom callbacks can be added for 'initialized', 'connected', and 'disconnected' 
    })
    return () => {
      unsubscribe()
    }
  }, [])
...
```

### Sending data
To send data to the channel that we are subscribe to we can use the `send` function as below.
```js
send({
  action: 'ping',
  payload: {}, // Optional
  useQueue: true // Optional, default: false
})
```

When setting useQueue to `true` the message will be added to a queue and will be sent as soon as possible. That is, immediately when the websocket is connected. If the websocket is not connected at the time `send()` is called it will be sent as soon as the websocket reconnects.