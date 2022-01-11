import { useEffect, useMemo, useState, useRef } from 'react';
import { createConsumer } from '@rails/actioncable';

global.addEventListener = () => {};

global.removeEventListener = () => {};

export function useActionCable(url, verbose = false) {
  const actionCable = useMemo(() => createConsumer(url), []);
  useEffect(() => {
    return () => {
      if (verbose) console.info('Disconnect Action Cable');
      actionCable.disconnect();
    };
  }, []);
  return {
    actionCable
  };
}
export function useChannel(actionCable, verbose = false) {
  const [queue, setQueue] = useState([]);
  const [connected, setConnected] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const channelRef = useRef();
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, []);

  const subscribe = (data, callbacks) => {
    if (verbose) console.info(`useActionCable - INFO: Connecting to ${data.channel}`);
    const channel = actionCable.subscriptions.create(data, {
      received: x => {
        if (verbose) console.info('useActionCable - INFO: Received ' + JSON.stringify(x));
        if (callbacks.received) callbacks.received(x);
      },
      initialized: () => {
        if (verbose) console.info('useActionCable - INFO: Init ' + data.channel);
        setSubscribed(true);
        if (callbacks.initialized) callbacks.initialized();
      },
      connected: () => {
        if (verbose) console.info('useActionCable - INFO: Connected to ' + data.channel);
        setConnected(true);
        if (callbacks.connected) callbacks.connected();
      },
      disconnected: () => {
        if (verbose) console.info('useActionCable - INFO: Disconnected');
        setConnected(false);
        if (callbacks.disconnected) callbacks.disconnected();
      }
    });
    channelRef.current = channel;
  };

  const unsubscribe = () => {
    setSubscribed(false);

    if (channelRef.current) {
      if (verbose) console.info('useActionCable - INFO: Unsubscribing from ' + channelRef.current.identifier);
      actionCable.subscriptions.remove(channelRef.current);
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (subscribed && connected && queue.length > 0) {
      processQueue();
    } else if ((!subscribed || !connected) && queue.length > 0) {
      if (verbose) console.info(`useActionCable - INFO: Queue paused. Subscribed: ${subscribed}. Connected: ${connected}. Queue length: ${queue.length}`);
    }
  }, [queue[0], connected, subscribed]);

  const processQueue = () => {
    const action = queue[0];

    try {
      perform(action.type, action.payload);
      setQueue(prevState => {
        let q = [...prevState];
        q.shift();
        return q;
      });
    } catch {
      if (verbose) console.warn(`useActionCable - WARN: Unable to perform ${action}. It will stay at the front of the queue.`);
    }
  };

  const enqueue = (action, payload) => {
    if (verbose) console.info('useActionCable - INFO: Adding action to queue - ' + action + ': ' + JSON.stringify(payload));
    setQueue(prevState => [...prevState, {
      type: action,
      payload: payload
    }]);
  };

  const perform = (action, payload) => {
    if (subscribed && !connected) throw 'useActionCable - ERROR: not connected';
    if (!subscribed) throw 'useActionCable - ERROR: not subscribed';
    try {
      if (verbose) console.info(`useActionCable - INFO: Sending ${action} with payload ${JSON.stringify(payload)}`)
      channelRef.current.perform(action, payload);
    } catch {
      throw 'useActionCable - ERROR: Unknown error';
    }
  };

  const send = ({action, payload, useQueue}) => {
    if (useQueue) {
      enqueue(action, payload)
    } else {
      perform(action, payload)
    }
  }

  return {
    subscribe,
    unsubscribe,
    send
  };
}