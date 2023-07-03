import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  buttonsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
  },

  captureButton: {
    borderRadius: 65,
    width: 65,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },

  rotateButtonStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#006EB6',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 4,
  },

  rotateTextStyle: {
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
    color: 'white',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },

  scanInstruction: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 80,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },

  scanInstructionWrapperText: {
    backgroundColor: 'black',
    padding: 6,
    borderRadius: 8,
  },
  scanInstructionText: {
    color: 'white',
  },

  miniButtonStyle: {
    marginHorizontal: 10,
    borderRadius: 10,
    backgroundColor: 'white',
  },
  miniButtonTextStyle: {
    textTransform: 'uppercase',
    fontWeight: 'bold',
    color: '#006EB6',
  },

})
export default styles
