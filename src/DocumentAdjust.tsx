import React from 'react'
import { Circle, Path, Svg } from 'react-native-svg'
import Animated, {
  useAnimatedProps,
  useSharedValue,
} from 'react-native-reanimated'
import { PanResponder, View } from 'react-native'

type DocumentAdjustProps = {
  bounds: number[];
  width: number;
  height: number;
  onAdjust: (bounds:number[])=>void;
};

const CAM_MARGIN = 16

const DocumentAdjust = ({
  bounds,
  width,
  height,
  onAdjust,
}: DocumentAdjustProps) => {
  const topLeftX = useSharedValue(bounds[0])
  const topLeftY = useSharedValue(bounds[1])
  const topRightX = useSharedValue(bounds[2])
  const topRightY = useSharedValue(bounds[3])
  const bottomLeftX = useSharedValue(bounds[4])
  const bottomLeftY = useSharedValue(bounds[5])
  const bottomRightX = useSharedValue(bounds[6])
  const bottomRightY = useSharedValue(bounds[7])

  const AnimatedPath = Animated.createAnimatedComponent(Path)
  const AnimatedCircleTopLeft = Animated.createAnimatedComponent(Circle)
  const AnimatedCircleTopRight = Animated.createAnimatedComponent(Circle)
  const AnimatedCircleBottomLeft = Animated.createAnimatedComponent(Circle)
  const AnimatedCircleBottomRight = Animated.createAnimatedComponent(Circle)

  const animatedPathProps = useAnimatedProps(() => {
    const path = `M${bottomRightX.value} ${bottomRightY.value} L${bottomLeftX.value} ${bottomLeftY.value} L${topLeftX.value} ${topLeftY.value} L${topRightX.value} ${topRightY.value} Z`
    return {
      d: path,
    }
  })

  const propsTopLeft = useAnimatedProps(() => {
    return { cx: topLeftX.value, cy: topLeftY.value }
  })
  const propsTopRight = useAnimatedProps(() => {
    return { cx: topRightX.value, cy: topRightY.value }
  })
  const propsBottomLeft = useAnimatedProps(() => {
    return { cx: bottomLeftX.value, cy: bottomLeftY.value }
  })
  const propsBottomRight = useAnimatedProps(() => {
    return { cx: bottomRightX.value, cy: bottomRightY.value }
  })

  const updateCoords = () => {
    onAdjust(
      [
        topLeftX.value,
        topLeftY.value,
        topRightX.value,
        topRightY.value,
        bottomLeftX.value,
        bottomLeftY.value,
        bottomRightX.value,
        bottomRightY.value,
      ].map((i) => Math.round(i)),
    )
  }

  const topLeftResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gestureState) => {
      const { dx, dy } = gestureState
      topLeftX.value = bounds[0] + dx
      topLeftY.value = bounds[1] + dy
    },
    onPanResponderRelease: updateCoords,
  })

  const topRightResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gestureState) => {
      const { dx, dy } = gestureState
      topRightX.value = bounds[2] + dx
      topRightY.value = bounds[3] + dy
    },
    onPanResponderRelease: updateCoords,
  })

  const bottomLeftResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gestureState) => {
      const { dx, dy } = gestureState
      bottomLeftX.value = bounds[4] + dx
      bottomLeftY.value = bounds[5] + dy
    },
    onPanResponderRelease: updateCoords,
  })

  const bottomRightResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (_event, gestureState) => {
      const { dx, dy } = gestureState
      bottomRightX.value = bounds[6] + dx
      bottomRightY.value = bounds[7] + dy
    },
    onPanResponderRelease: updateCoords,
  })

  return (
    <View
      style={{
        position: 'absolute',
        left: -CAM_MARGIN,
        right: -CAM_MARGIN,
        top: -CAM_MARGIN,
        bottom: -CAM_MARGIN,
      }}
    >
      <Svg
        width="100%"
        height="100%"
        stroke={'white'}
        strokeLinecap={'round'}
        strokeLinejoin={'miter'}
        strokeWidth={4}
        fill={'white'}
        fillOpacity={0.5}
        viewBox={`0 0 ${height} ${width}`} // review this!
      >
        <AnimatedPath animatedProps={animatedPathProps} fill={'green'} />
        <AnimatedCircleTopLeft
          animatedProps={propsTopLeft}
          strokeWidth={0}
          r={100}
          {...topLeftResponder.panHandlers}
        />
        <AnimatedCircleTopRight
          animatedProps={propsTopRight}
          strokeWidth={0}
          r={100}
          {...topRightResponder.panHandlers}
        />
        <AnimatedCircleBottomLeft
          animatedProps={propsBottomLeft}
          strokeWidth={0}
          r={100}
          {...bottomLeftResponder.panHandlers}
        />
        <AnimatedCircleBottomRight
          animatedProps={propsBottomRight}
          strokeWidth={0}
          r={100}
          {...bottomRightResponder.panHandlers}
        />
      </Svg>
    </View>
  )
}

export default DocumentAdjust
