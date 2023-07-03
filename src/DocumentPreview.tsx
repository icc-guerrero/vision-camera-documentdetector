import React, { useState } from 'react'
import { Image, StyleSheet, View } from 'react-native'
import { Button } from 'react-native-elements'
import styles from './styles/styles'
import DocumentDetectorManager from './native/DocumentDetectorManager'

type DocumentPreviewProps = {
  documentUri: string
  onRescan: ()=>void
};

const DocumentPreview = ({ documentUri, onRescan }: DocumentPreviewProps) => {
  const [document, setDocument] = useState<string>(documentUri)

  const rotateDocument = async () => {
    try {
      if (document) {
        const newPath = await DocumentDetectorManager.rotateImage(document)
        setDocument(newPath)
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (<>
    <View style={{ paddingHorizontal: 10, width: '100%', height: '100%' }}>
      <View style={{ flex: 1 }}>
        {documentUri &&
          <Image source={{ uri: document.startsWith('file://') ? document : `file://${document}` }}
            style={[StyleSheet.absoluteFill, { resizeMode: 'contain' }]}
          />}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <Button
          onPress={() => rotateDocument()}
          title={'Rotate'}
          buttonStyle={styles.miniButtonStyle}
          titleStyle={styles.miniButtonTextStyle}
        />
        <Button
          onPress={() => onRescan()}
          title={'Re-scan'}
          buttonStyle={styles.miniButtonStyle}
          titleStyle={styles.miniButtonTextStyle}
        />
      </View>
    </View>
  </>)
}

export default DocumentPreview
