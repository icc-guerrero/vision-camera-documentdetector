import React from 'react'
import { Path, Svg } from 'react-native-svg'
import Animated, { useAnimatedProps, useSharedValue, withSpring } from 'react-native-reanimated'
import { View } from 'react-native'

type DocumentLayoutProps = {
  bounds: number[],
  height: number,
  width: number
  areaStable: boolean | undefined
};

const CAM_MARGIN = 16
const AnimatedPath = Animated.createAnimatedComponent(Path)

const DocumentLayout = ({ bounds, height, width, areaStable }: DocumentLayoutProps) => {
  const topLeftX = useSharedValue(bounds[0])
  const topLeftY = useSharedValue(bounds[1])
  const topRightX = useSharedValue(bounds[2])
  const topRightY = useSharedValue(bounds[3])
  const bottomLeftX = useSharedValue(bounds[4])
  const bottomLeftY = useSharedValue(bounds[5])
  const bottomRightX = useSharedValue(bounds[6])
  const bottomRightY = useSharedValue(bounds[7])

  const animatedProps = useAnimatedProps(() => {
    topLeftX.value = withSpring(bounds[0])
    topLeftY.value = withSpring(bounds[1])
    topRightX.value = withSpring(bounds[2])
    topRightY.value = withSpring(bounds[3])
    bottomLeftX.value = withSpring(bounds[4])
    bottomLeftY.value = withSpring(bounds[5])
    bottomRightX.value = withSpring(bounds[6])
    bottomRightY.value = withSpring(bounds[7])

    const path = `M${bottomRightX.value} ${bottomRightY.value} L${bottomLeftX.value} ${bottomLeftY.value} L${topLeftX.value} ${topLeftY.value} L${topRightX.value} ${topRightY.value} Z`
    return {
      d: path,
    }
  })

  return (
    <View style={{ position: 'absolute', left: -CAM_MARGIN, right: -CAM_MARGIN, top: -CAM_MARGIN, bottom: -CAM_MARGIN }}>
      <Svg
        width={'100%'}
        height={'100%'}
        stroke={'white'}
        strokeLinecap={'round'}
        strokeLinejoin={'miter'}
        strokeWidth={4}
        fill={(areaStable) ? 'green' : 'white'}
        fillOpacity={0.5}
        viewBox={`0 0 ${height} ${width}`} // review this!
      >
        {bounds[0] !== 0 && <AnimatedPath strokeWidth={0} animatedProps={animatedProps} />}

      </Svg></View>)
}

export default DocumentLayout
