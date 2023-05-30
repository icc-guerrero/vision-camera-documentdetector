import Svg, {Path} from 'react-native-svg';
import React from 'react';

export interface Size {
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}
export interface DetectedDocumentProps {
  screen: Size;
  p1: Point;
  p2: Point;
  p3: Point;
  p4: Point;
}

const DetectedDocument = ({screen, p1, p2, p3, p4}: DetectedDocumentProps) => {
  return (
    <Svg
      width={screen.width}
      height={screen.height}
      fill="transparent"
      stroke="white"
      viewBox={`0 0 ${screen.width} ${screen.height}`}>
      {/*<AnimatedPath animatedProps={animatedProps} fill="black" />*/}
      <Path
        d={`M${p1.x},${p1.y}L${p2.x},${p2.y},${p3.x},${p3.y},${p4.x},${p4.y},${p1.x},${p1.y}`}
        fillOpacity={0.2}
        fill={'white'}
      />
    </Svg>
  );
};

export default DetectedDocument;
