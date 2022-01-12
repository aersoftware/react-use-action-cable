import { useState, useEffect } from 'react';
import './App.css';

import { useActionCable, useChannel } from '@aersoftware/react-use-action-cable';

function App() {
  const { actionCable } = useActionCable('ws://localhost:3000/cable');
  const { subscribe, unsubscribe, send } = useChannel(actionCable);
  
  const [ receivedData, setReceivedData ] = useState();

  useEffect(() => {
    subscribe({
      channel: 'PingChannel',
    }, {
      received: (data) => setReceivedData(data)
    })
    return () => {
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => {
          send({
            action: 'ping',
            payload: {me: Date.now()}
          })
        }}>Ping</button>
        <p>
          Received data: <br/>
          {JSON.stringify(receivedData)}
        </p>
      </header>
    </div>
  );
}

export default App;
