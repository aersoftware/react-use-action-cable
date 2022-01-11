# React Native example
This example assumes that a Rails Action Cable exists on ws://localhost:3000/cable with a channel 'PingChannel' that responds to the action `ping` with the payload `{me: Date.now()}`.

## Running the example
```bash
npm install
expo start
```