/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {SafeAreaView, StyleSheet, View} from 'react-native';

import DocumentScan from 'vision-camera-documentdetector/src/DocumentScan';

function App(): JSX.Element {
  return (
    <SafeAreaView style={StyleSheet.absoluteFill}>
      <View style={StyleSheet.absoluteFill}>
        <DocumentScan
          onCapture={(path) => {
            console.log('CAPTURED', path);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
