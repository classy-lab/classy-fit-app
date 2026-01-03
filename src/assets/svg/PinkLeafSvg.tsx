import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const PinkLeafSvg = (props) => (
  <Svg
    width="86.2836651px"
    height="74.8180152px"
    viewBox="0 0 86.2836651 74.8180152"
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
        id="Start-Screen"
        transform="translate(-217.830389, -60.000000)"
        fill="#FF4DED"
      >
        <G id="title" transform="translate(95.000000, 60.000000)">
          <Path
            d="M138.444444,21.051263 C155.333333,3.81563627 206,0.858470242 206,21.051263 C206,30.0413299 195.957186,43.2766708 175.871559,60.7572856 L175.871558,60.7572848 C164.496549,70.6570082 147.249971,69.4610527 137.350247,58.0860434 C128.001836,47.344505 128.478174,31.2221467 138.444444,21.051263 C138.444444,21.051263 138.444444,21.051263 138.444444,21.051263 Z"
            id="Rectangle-Copy-3"
            transform="translate(168.000000, 48.493770) rotate(-12.000000) translate(-168.000000, -48.493770) "
          />
        </G>
      </G>
    </G>
  </Svg>
);
export default PinkLeafSvg;
