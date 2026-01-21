import * as React from "react";
import Svg, { G, Text, TSpan, Path } from "react-native-svg";
/* SVGR has dropped some elements not supported by react-native-svg: title */
const EarningsBarGraph = (props) => (
  <Svg
    width="260px"
    height="200px"
    viewBox="0 0 260 200"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    {...props}
  >
    <G id="Owners" stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
      <G id="Earnings" transform="translate(-57.000000, -309.000000)">
        <G id="container" transform="translate(-58.000000, -219.000000)">
          <G id="content" transform="translate(88.000000, 424.000000)">
            <G id="barGraph" transform="translate(27.000000, 104.000000)">
              <G id="Column-1" transform="translate(0.000000, 105.000000)">
                <Text
                  id="9/01"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={93}>
                    {"9/01"}
                  </TSpan>
                </Text>
                <G>
                  <Path
                    d="M4,26 C6.209139,26 8,27.790861 8,30 L8,81 L8,81 L0,81 L0,30 C-2.705415e-16,27.790861 1.790861,26 4,26 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,81 L20,81 L12,81 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
              <G id="Column-2" transform="translate(40.000000, 42.000000)">
                <Text
                  id="9/02"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={156}>
                    {"9/02"}
                  </TSpan>
                </Text>
                <G id="Column-1">
                  <Path
                    d="M4,46 C6.209139,46 8,47.790861 8,50 L8,144 L8,144 L0,144 L0,50 C-2.705415e-16,47.790861 1.790861,46 4,46 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,144 L20,144 L12,144 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
              <G id="Column-3" transform="translate(80.000000, 145.000000)">
                <Text
                  id="9/03"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={53}>
                    {"9/03"}
                  </TSpan>
                </Text>
                <G id="Column-1">
                  <Path
                    d="M4,13 C6.209139,13 8,14.790861 8,17 L8,41 L8,41 L0,41 L0,17 C-2.705415e-16,14.790861 1.790861,13 4,13 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,41 L20,41 L12,41 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
              <G id="Column-4" transform="translate(120.000000, 0.000000)">
                <Text
                  id="9/04"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={198}>
                    {"9/04"}
                  </TSpan>
                </Text>
                <G id="Column-1">
                  <Path
                    d="M4,59 C6.209139,59 8,60.790861 8,63 L8,186 L8,186 L0,186 L0,63 C-2.705415e-16,60.790861 1.790861,59 4,59 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,186 L20,186 L12,186 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
              <G id="Column-5" transform="translate(160.000000, 91.000000)">
                <Text
                  id="9/05"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={107}>
                    {"9/05"}
                  </TSpan>
                </Text>
                <G id="Column-1">
                  <Path
                    d="M4,30 C6.209139,30 8,31.790861 8,34 L8,95 L8,95 L0,95 L0,34 C1.73547709e-16,31.790861 1.790861,30 4,30 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,95 L20,95 L12,95 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
              <G id="Column-6" transform="translate(200.000000, 130.000000)">
                <Text
                  id="9/06"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={68}>
                    {"9/06"}
                  </TSpan>
                </Text>
                <G id="Column-1">
                  <Path
                    d="M4,18 C6.209139,18 8,19.790861 8,22 L8,56 L8,56 L0,56 L0,22 C-2.705415e-16,19.790861 1.790861,18 4,18 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,56 L20,56 L12,56 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
              <G id="Column-7" transform="translate(240.000000, 144.000000)">
                <Text
                  id="9/07"
                  fontFamily="SFPro-Regular, SF Pro"
                  fontSize={8}
                  fontWeight="normal"
                  fill="#B0BED4"
                >
                  <TSpan x={0} y={54}>
                    {"9/07"}
                  </TSpan>
                </Text>
                <G id="Column-1">
                  <Path
                    d="M4,13 C6.209139,13 8,14.790861 8,17 L8,42 L8,42 L0,42 L0,17 C-2.705415e-16,14.790861 1.790861,13 4,13 Z"
                    id="Rectangle"
                    fill="#FFE700"
                  />
                  <Path
                    d="M16,0 C18.209139,-4.05812251e-16 20,1.790861 20,4 L20,42 L20,42 L12,42 L12,4 C12,1.790861 13.790861,4.05812251e-16 16,0 Z"
                    id="Rectangle-Copy"
                    fill="#FF6C40"
                  />
                </G>
              </G>
            </G>
          </G>
        </G>
      </G>
    </G>
  </Svg>
);
export default EarningsBarGraph;
