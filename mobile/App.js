import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>BeeAR Virtual Try-On</Text>
      <WebView 
        source={{ uri: 'https://demo.mergeos.com/beear' }} 
        style={styles.webview} 
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  webview: {
    flex: 1,
  }
});