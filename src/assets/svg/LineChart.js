import * as React from "react";
import Svg, { G, Path } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const LineChart = (props) => (
  <Svg
    width="117.750984px"
    height="75.1406779px"
    viewBox="0 0 117.750984 75.1406779"
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
        transform="translate(-46.358430, -602.833756)"
        strokeWidth={1.5}
      >
        <G id="container" transform="translate(-58.000000, -219.000000)">
          <G id="content" transform="translate(88.000000, 424.000000)">
            <G id="cards" transform="translate(0.000000, 337.000000)">
              <G id="Line-Chart" transform="translate(17.108626, 61.589404)">
                <Path
                  d="M0,73.6348338 C6.12184555,47.4463929 13.9699944,32.8838465 23.5444465,29.9471947 C37.9061247,25.542217 47.0971993,61.9729882 64.7063861,53.7882543 C82.3155729,45.6035204 78.0653858,8.15634255 83.3865815,2.13262514 C86.9340453,-1.88318646 94.4551879,-0.227557321 105.950009,7.09951256"
                  id="Path-2"
                  stroke="#FF6C40"
                />
                <Path
                  d="M0,73.6348338 C8.2840724,53.6758979 16.4592274,43.093 24.5254651,41.8861402 C36.6248217,40.0758506 40.3361498,69.0367529 52.9750047,65.7087841 C65.6138596,62.3808152 61.1160148,37.3904707 69.8668151,29.9471947 C78.6176154,22.5039186 89.6738418,31.3939876 102.025935,23.9869298 C110.260664,19.0488912 115.002254,11.764123 116.250705,2.13262514"
                  id="Path-3"
                  stroke="#2CD9C5"
                />
                <Path
                  d="M0,73.6348338 C12.230862,50.0348948 22.6130398,36.9826903 31.1465334,34.4782202 C43.9467738,30.7215152 49.7437253,58.0031636 66.7092652,54.056527 C83.6748051,50.1098905 82.8575947,23.5914728 90.2537117,20.7283159 C95.1844564,18.8195446 101.262183,24.5380158 108.486892,37.8837295"
                  id="Path-4"
                  stroke="#FFE700"
                />
              </G>
            </G>
          </G>
        </G>
      </G>
    </G>
  </Svg>
);
export default LineChart;
