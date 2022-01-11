import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button } from 'react-native';
import React, { useEffect, useState} from 'react';
import { useActionCable, useChannel } from '@aersoftware/react-use-action-cable';

export default function App() {
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
  }, [])

  return (
    <View style={styles.container}>
      <Button title='Ping' onPress={() => {
        send({
          action: 'ping',
          payload: {me: Date.now()}
        })
      }}/>
      <Text>Received data:</Text>
      <Text>{JSON.stringify(receivedData)}</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
