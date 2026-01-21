import * as React from "react";
import Svg, { G, Polyline } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const LineChart3 = (props) => (
  <Svg
    width="117.75079px"
    height="50.4404116px"
    viewBox="0 0 117.75079 50.4404116"
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
      strokeLinecap="round"
    >
      <G
        id="Earnings"
        transform="translate(-46.358616, -785.922657)"
        stroke="#FF6C40"
        strokeWidth={1.5}
      >
        <G id="container" transform="translate(-58.000000, -219.000000)">
          <G id="content" transform="translate(88.000000, 424.000000)">
            <G id="cards" transform="translate(0.000000, 337.000000)">
              <G id="class" transform="translate(0.000000, 167.000000)">
                <Polyline
                  id="Path-7"
                  points="17.1086262 95.4042232 37.2364217 118.408436 53.1170995 79 70.0836309 124.681482 77.4920128 89.8834764 99.6325879 79 109.696486 100.395956 117.747604 82.3834764 133.359331 105.446088"
                />
              </G>
            </G>
          </G>
        </G>
      </G>
    </G>
  </Svg>
);
export default LineChart3;
