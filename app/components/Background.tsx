import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const WavyBackground = () => {
  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%' }}>
      <Svg width="100%" height="100%" viewBox="0 0 375 812" preserveAspectRatio="none">
        <Path
          d="M0 0H375V612C375 612 295 642 187.5 642C80 642 0 612 0 612V0Z"
          fill="#4A90A4"
          fillOpacity={0.1}
        />
      </Svg>
    </View>
  );
};

const CurvedCard = () => {
  return (
    <View style={{ position: 'absolute', width: '100%', height: '100%', left: 0, top: 0, zIndex: 0 }}>
      <Svg width="100%" height="100%" viewBox="0 0 375 500" preserveAspectRatio="none">
        <Path
          d="M0,0 H375 V450 C375,450 295,500 187.5,500 C80,500 0,450 0,450 V0 Z"
          fill="#FFFFFF"
          fillOpacity={0.05}
        />
      </Svg>
    </View>
  );
};

export default WavyBackground;
export { CurvedCard };