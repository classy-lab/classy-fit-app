import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const PinkShape = (props) => (
  <Svg
    width="150.586808px"
    height="139.597724px"
    viewBox="0 0 150.586808 139.597724"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <G
      id="Owners"
      stroke="none"
      strokeWidth={1}
      fill="none"
      fillRule="evenodd"
      fillOpacity={0.3}
    >
      <G
        id="Contact"
        transform="translate(-188.000000, -30.000000)"
        fill="#FF4DED"
      >
        <Path
          d="M189.672708,104.26353 C198.504236,67.3153979 207.84074,34.1710054 245.672708,30.26353 C283.504675,26.3560545 324.646794,66.8432612 334.901904,89.26353 C345.157014,111.683799 333.66714,142.016074 304.672708,155.26353 C275.678275,168.510986 254.583315,173.882616 231.672708,165.76353 C208.762101,157.644444 180.841179,141.211662 189.672708,104.26353 Z"
          id="Rectangle"
        />
      </G>
    </G>
  </Svg>
);
export default PinkShape;
