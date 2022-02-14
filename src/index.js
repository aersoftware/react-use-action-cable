import { useEffect, useMemo, useState, useRef } from 'react';
import { createConsumer } from '@rails/actioncable';

global.addEventListener = () => {};

global.removeEventListener = () => {};

const log = (x) => {
  if(x.verbose) console[x.type](`useActionCable: ${x.message}`)
}

export function useActionCable(url, {verbose} = {verbose: false}) {
  const actionCable = useMemo(() => createConsumer(url), []);
  useEffect(() => {
    log({
      verbose: verbose,
      type: 'info',
      message: 'Created Action Cable'
    });
    return () => {
      log({
        verbose: verbose,
        type: 'info',
        message: 'Disconnected Action Cable'
      });
      actionCable.disconnect();
    };
  }, []);
  return {
    actionCable
  };
}

export function useChannel(actionCable, {verbose} = {verbose: false}) {
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
    log({
      verbose: verbose,
      type: 'info',
      message: `Connecting to ${data.channel}`
    });
    const channel = actionCable.subscriptions.create(data, {
      received: x => {
        log({
          verbose: verbose,
          type: 'info',
          message: `Received ${JSON.stringify(x)}`
        });
        if (callbacks.received) callbacks.received(x);
      },
      initialized: () => {
        log({
          verbose: verbose,
          type: 'info',
          message: `Init ${data.channel}`
        });
        setSubscribed(true);
        if (callbacks.initialized) callbacks.initialized();
      },
      connected: () => {
        log({
          verbose: verbose,
          type: 'info',
          message: `Connected to ${data.channel}`
        });
        setConnected(true);
        if (callbacks.connected) callbacks.connected();
      },
      disconnected: () => {
        log({
          verbose: verbose,
          type: 'info',
          message: `Disconnected`
        });
        setConnected(false);
        if (callbacks.disconnected) callbacks.disconnected();
      }
    });
    channelRef.current = channel;
  };

  const unsubscribe = () => {
    setSubscribed(false);

    if (channelRef.current) {
      log({
        verbose: verbose,
        type: 'info',
        message: `Unsubscribing from ${channelRef.current.identifier}`
      });
      actionCable.subscriptions.remove(channelRef.current);
      channelRef.current = null;
    }
  };

  useEffect(() => {
    if (subscribed && connected && queue.length > 0) {
      processQueue();
    } else if ((!subscribed || !connected) && queue.length > 0) {
      log({
        verbose: verbose,
        type: 'info',
        message: `Queue paused. Subscribed: ${subscribed}. Connected: ${connected}. Queue length: ${queue.length}`
      });
    }
  }, [queue[0], connected, subscribed]);

  const processQueue = () => {
    const action = queue[0];

    try {
      perform(action.action, action.payload);
      setQueue(prevState => {
        let q = [...prevState];
        q.shift();
        return q;
      });
    } catch {
      log({
        verbose: verbose,
        type: 'warn',
        message: `Unable to perform action '${action.action}'. It will stay at the front of the queue.`
      });
    }
  };

  const enqueue = (action, payload) => {
    log({
      verbose: verbose,
      type: 'info',
      message: `Adding action to queue - ${action}: ${JSON.stringify(payload)}`
    });
    setQueue(prevState => [...prevState, {
      action: action,
      payload: payload
    }]);
  };

  const perform = (action, payload) => {
    if (subscribed && !connected) throw 'useActionCable: not connected';
    if (!subscribed) throw 'useActionCable: not subscribed';
    try {
      log({
        verbose: verbose,
        type: 'info',
        message: `Sending ${action} with payload ${JSON.stringify(payload)}`
      });
      channelRef.current.perform(action, payload);
    } catch {
      throw 'useActionCable: Unknown error';
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