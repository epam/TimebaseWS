import globalThis from 'globalthis';
import { EResourceType, EGradientDirection } from '@deltix/hd.components-utils';

globalThis().regeneratorRuntime = undefined;

var EAggregationTypes;

(function (EAggregationTypes) {
  EAggregationTypes["price"] = "price";
  EAggregationTypes["quantity"] = "quantity";
  EAggregationTypes["quantityTotalPrice"] = "quantityTotalPrice";
  EAggregationTypes["quantityAveragePrice"] = "quantityAveragePrice";
})(EAggregationTypes || (EAggregationTypes = {}));

const noopFormatFunction = numberToFormat => {
  const splitted = numberToFormat.split('.');
  const integerPart = splitted[0];
  const fractionalPart = splitted[1] || '';
  return {
    integerPart,
    fractionalPart,
    decimalSeparator: '.'
  };
};
const noopDefaultFormatFunction = value => {
  return value;
};

const commonFonts = [{
  name: "RobotoCondensed_regular",
  path: "/Assets/fonts/TTF/RobotoCondensed_regular.ttf",
  type: EResourceType.font
}, // {
//   name: "RobotoMono_regular",
//   path: "/Assets/fonts/TTF/RobotoMono_regular.ttf",
//   type: EResourceType.font,
// },
{
  name: "RobotoMono_300_10",
  path: "/Assets/fonts/Bitmap/RobotoMono_300_10.xml",
  type: EResourceType.bitmap
}, // {
//   name: "RobotoMono_300_16",
//   path: "/Assets/fonts/Bitmap/RobotoMono_300_16.xml",
//   type: EResourceType.bitmap,
// },
{
  name: "RobotoCondensed_300_10",
  path: "/Assets/fonts/Bitmap/RobotoCondensed_300_10.xml",
  type: EResourceType.bitmap
}, // {
//   name: "RobotoCondensed_300_11",
//   path: "/Assets/fonts/Bitmap/RobotoCondensed_300_11.xml",
//   type: EResourceType.bitmap,
// },
// {
//   name: "RobotoCondensed_300_12",
//   path: "/Assets/fonts/Bitmap/RobotoCondensed_300_12.xml",
//   type: EResourceType.bitmap,
// },
{
  name: "RobotoCondensed_300_16",
  path: "/Assets/fonts/Bitmap/RobotoCondensed_300_16.xml",
  type: EResourceType.bitmap
}];

// /* tslint:disable-next-line */
// export const ttfRobotoMono_regular_10: PIXI.TextStyleOptions = {
//   fontFamily: "RobotoMono_regular",
//   fontSize: "10px",
//   fill: 0xffffff,
//   // letterSpacing: 0.3,
// };

/* tslint:disable-next-line */
const ttfRobotoCondensed_regular_10 = {
  fontFamily: "RobotoCondensed_regular",
  fontSize: 10,
  fill: 0xffffff
};
const isTTF = styles => typeof styles.fontFamily === "string";
const robotoMonoRegular10 = {
  // font: {
  //   name: "RobotoMono_300_10",
  //   size: 10,
  // },
  fontName: "RobotoMono_300_10",
  fontSize: 10,
  fill: 0xffffff,
  letterSpacing: -3
}; // export const robotoMonoRegular16: IBitmapTextStyle = {
//   font: {
//     name: "RobotoMono_300_16",
//     size: 16,
//   },
//   fill: 0xffffff,
//   letterSpacing: 0,
// };

const robotoCondensedRegular10 = {
  fill: 0xffffff,
  letterSpacing: -1,
  fontName: "RobotoCondensed_300_10",
  fontSize: 10
}; // export const robotoCondensedRegular11: IBitmapTextStyle = {
//   font: {
//     name: "RobotoCondensed_300_11",
//     size: 11,
//   },
//   fill: 0xffffff,
//   letterSpacing: -1,
// };
// export const robotoCondensedRegular12: IBitmapTextStyle = {
//   font: {
//     name: "RobotoCondensed_300_12",
//     size: 12,
//   },
//   fill: 0xffffff,
//   letterSpacing: -1,
// };

const robotoCondensedRegular16 = {
  fill: 0xffffff,
  letterSpacing: -1,
  fontName: "RobotoCondensed_300_16",
  fontSize: 16
};

const getFillColor = style => style.tint == null ? style.fill : style.tint;

const rgb = color => parseInt(color.replace("#", "0x"), 16);

const darkCryptoCortexColors = {
  green: rgb("#1ddf68"),
  green2: rgb("#096e23"),
  pink: rgb("#ff2566"),
  pink2: rgb("#690018"),
  pink3: rgb("#d5264e"),
  black: rgb("#1f2735"),
  black1: rgb("#000000"),
  white: rgb("#ffffff"),
  grey: rgb("#6f7d8e"),
  grey2: rgb("#aeafb0"),
  grey3: rgb("#76b0cd"),
  blue: rgb("#27384d"),
  blue2: rgb("#2a3448"),
  blue3: rgb("#5e7293"),
  blue4: rgb("#364a55"),
  blue5: rgb("#56707d"),
  blue6: rgb("#a8d2ed"),
  blue7: rgb("#cfe7f6"),
  blue8: rgb("#e8e9ea"),
  blue9: rgb("#00aaff"),
  gradient: rgb("#0f3142")
};
const whiteCryptoCortexColors = {
  green: rgb("#20bb3c"),
  green2: rgb("#4cd764"),
  pink: rgb("#ec2851"),
  black: rgb("#000000"),
  hover: rgb("#ebecef"),
  blue: rgb("#cbdaff"),
  blue1: rgb("#667e9f"),
  blue2: rgb("#89b9e9"),
  blue3: rgb("#506ca3"),
  blue4: rgb("#0258ff"),
  blue5: rgb("#7cb7f1"),
  blue6: rgb("#011223"),
  blue7: rgb("#a7d4ff"),
  white: rgb("#ffffff"),
  white2: rgb("#f7f8fb"),
  white3: rgb("#f7f8fa"),
  grey: rgb("#6d6d6d"),
  grey1: rgb("#686c71"),
  grey2: rgb("#eeeeee"),
  grey3: rgb("#6a6c71")
};

//   direction: EGradientDirection.horizontal,
//   colors: [
//     [0, "#0f3142"],
//     [0.47, "#142a39"],
//     [1, "#131e33"],
//   ],
// };

const darkCryptoCortexDepthChart = {
  background: {
    color: 0x142537,
    gradient: undefined
  },
  plotter: {
    lineWidth: 3,
    buy: {
      line: {
        color: darkCryptoCortexColors.green,
        alpha: 1,
        shadow: [{
          blur: 1.5,
          distance: 4,
          rotation: 180,
          color: 0x096e23,
          alpha: 1,
          quality: 10
        }]
      },
      area: {
        color: darkCryptoCortexColors.green2,
        alpha: 0.4
      }
    },
    sell: {
      line: {
        color: darkCryptoCortexColors.pink3,
        alpha: 1,
        shadow: [{
          blur: 1.5,
          distance: 4,
          rotation: 0,
          color: 0x690018,
          alpha: 1,
          quality: 10
        }]
      },
      area: {
        color: darkCryptoCortexColors.pink2,
        alpha: 0.4
      }
    }
  },
  xAxis: {
    label: {
      color: darkCryptoCortexColors.grey2 // +

    },
    background: {
      color: 0x131e33
    }
  },
  yAxis: {
    label: {
      color: darkCryptoCortexColors.grey2 // +

    }
  },
  tooltip: {
    buy: {
      color: darkCryptoCortexColors.green
    },
    sell: {
      color: darkCryptoCortexColors.pink3
    }
  },
  midPrice: {
    price: {
      color: darkCryptoCortexColors.grey2
    },
    label: {
      color: darkCryptoCortexColors.grey2
    },
    line: {
      color: darkCryptoCortexColors.grey2
    }
  }
};

const whiteCryptoCortexDepthChart = {
  background: {
    color: whiteCryptoCortexColors.white3,
    gradient: void 0
  },
  plotter: {
    lineWidth: 3,
    buy: {
      line: {
        color: whiteCryptoCortexColors.green2,
        alpha: 0.8,
        shadow: [{
          blur: 1.5,
          distance: 4,
          rotation: 180,
          color: 0x114019,
          alpha: 1,
          quality: 10
        }]
      },
      area: {
        color: whiteCryptoCortexColors.green2,
        alpha: 0.4
      }
    },
    sell: {
      line: {
        color: whiteCryptoCortexColors.pink,
        alpha: 0.8,
        shadow: [{
          blur: 1.5,
          distance: 4,
          rotation: 0,
          color: 0x89132d,
          alpha: 1,
          quality: 10
        }]
      },
      area: {
        color: whiteCryptoCortexColors.pink,
        alpha: 0.4
      }
    }
  },
  xAxis: {
    label: {
      color: whiteCryptoCortexColors.grey3
    },
    background: {
      color: whiteCryptoCortexColors.white3
    }
  },
  yAxis: {
    label: {
      color: whiteCryptoCortexColors.grey3
    }
  },
  tooltip: {
    buy: {
      color: whiteCryptoCortexColors.green2
    },
    sell: {
      color: whiteCryptoCortexColors.pink
    }
  },
  midPrice: {
    price: {
      color: whiteCryptoCortexColors.grey3 // +

    },
    label: {
      color: whiteCryptoCortexColors.blue2 // +

    },
    line: {
      color: whiteCryptoCortexColors.blue2 // +

    }
  }
};

const darkCryptoCortexOrderGrid = {
  background: {
    color: darkCryptoCortexColors.blue
  },
  quantity: {
    buy: {
      ceilPart: {
        color: darkCryptoCortexColors.white
      },
      decimalPart: {
        color: darkCryptoCortexColors.green
      },
      zeroPart: {
        color: darkCryptoCortexColors.grey
      }
    },
    sell: {
      ceilPart: {
        color: darkCryptoCortexColors.white
      },
      decimalPart: {
        color: darkCryptoCortexColors.pink
      },
      zeroPart: {
        color: darkCryptoCortexColors.grey
      }
    }
  },
  price: {
    buy: {
      color: darkCryptoCortexColors.green
    },
    sell: {
      color: darkCryptoCortexColors.pink
    }
  },
  exchange: {
    color: darkCryptoCortexColors.white
  },
  hovered: {
    color: darkCryptoCortexColors.black,
    alpha: 1
  },
  highlighted: {
    color: darkCryptoCortexColors.white,
    alpha: 0.1
  },
  spreadLine: {
    border: {
      color: darkCryptoCortexColors.blue2,
      alpha: 1
    },
    background: {
      color: darkCryptoCortexColors.blue2
    },
    text: {
      color: darkCryptoCortexColors.blue3
    }
  }
};

const whiteCryptoCortexOrderGrid = {
  background: {
    color: whiteCryptoCortexColors.white2
  },
  quantity: {
    buy: {
      ceilPart: {
        color: whiteCryptoCortexColors.green
      },
      decimalPart: {
        color: whiteCryptoCortexColors.green
      },
      zeroPart: {
        color: whiteCryptoCortexColors.grey
      }
    },
    sell: {
      ceilPart: {
        color: whiteCryptoCortexColors.pink
      },
      decimalPart: {
        color: whiteCryptoCortexColors.pink
      },
      zeroPart: {
        color: whiteCryptoCortexColors.grey
      }
    }
  },
  price: {
    buy: {
      color: whiteCryptoCortexColors.green
    },
    sell: {
      color: whiteCryptoCortexColors.pink
    }
  },
  exchange: {
    color: whiteCryptoCortexColors.black
  },
  hovered: {
    color: whiteCryptoCortexColors.hover,
    alpha: 1
  },
  highlighted: {
    color: whiteCryptoCortexColors.blue3,
    alpha: 0.1
  },
  spreadLine: {
    border: {
      color: whiteCryptoCortexColors.grey2,
      alpha: 1
    },
    background: {
      color: whiteCryptoCortexColors.grey2
    },
    text: {
      color: whiteCryptoCortexColors.grey1
    }
  }
};

//   direction: EGradientDirection.horizontal,
//   colors: [
//     [0, "#0f3142"],
//     [0.47, "#142a39"],
//     [1, "#131e33"],
//   ],
// };

const darkCryptoCortexPriceChart = {
  background: {
    image: undefined,
    gradient: undefined,
    alpha: undefined,
    color: 0x142537
  },
  XGrid: {
    mainGrid: {
      color: darkCryptoCortexColors.blue4,
      lineWidth: 1,
      alpha: 1
    },
    subGrid: {
      color: darkCryptoCortexColors.blue4,
      lineWidth: 0.5,
      alpha: 1
    }
  },
  YGrid: {
    mainGrid: {
      color: darkCryptoCortexColors.blue4,
      lineWidth: 1,
      alpha: 1
    },
    subGrid: {
      color: darkCryptoCortexColors.blue4,
      lineWidth: 1,
      alpha: 1
    }
  },
  XAxis: {
    label: {
      color: darkCryptoCortexColors.grey2
    }
  },
  YAxis: {
    label: {
      color: darkCryptoCortexColors.grey2
    }
  },
  loadHatch: {
    color: darkCryptoCortexColors.blue4,
    alpha: 0.1
  },
  legend: {
    color: darkCryptoCortexColors.grey2
  },
  focusOnPoint: {
    color: darkCryptoCortexColors.grey2
  },
  endPoint: {
    circle: {
      color: darkCryptoCortexColors.green,
      radius: 3,
      alpha: 1
    },
    blur: {
      color: darkCryptoCortexColors.green
    }
  },
  crosshair: {
    xAxisLabel: {
      background: {
        color: darkCryptoCortexColors.blue7,
        alpha: 1
      },
      text: {
        color: darkCryptoCortexColors.black1
      }
    },
    yAxisLabel: {
      background: {
        color: darkCryptoCortexColors.blue7,
        alpha: 1
      },
      text: {
        color: darkCryptoCortexColors.black1
      }
    },
    lines: {
      width: 0.5,
      color: darkCryptoCortexColors.blue6,
      opacity: 1
    }
  },
  currentRateLabel: {
    background: {
      color: darkCryptoCortexColors.blue7,
      alpha: 1
    },
    line: {
      color: darkCryptoCortexColors.blue6,
      alpha: 1,
      width: 1
    },
    text: {
      eq: {
        color: darkCryptoCortexColors.black1
      },
      up: {
        color: darkCryptoCortexColors.green
      },
      down: {
        color: darkCryptoCortexColors.pink
      }
    }
  },
  barPlotter: {
    up: {
      color: darkCryptoCortexColors.green
    },
    down: {
      color: darkCryptoCortexColors.pink
    },
    even: {
      color: darkCryptoCortexColors.white
    },
    filters: [{
      distance: 0,
      blur: 1,
      quantity: 5,
      color: '#ffffff'
    }]
  },
  volumePlotter: {
    color: darkCryptoCortexColors.grey,
    alpha: 0.5
  },
  candlestickPlotter: {
    up: {
      color: darkCryptoCortexColors.green
    },
    down: {
      color: darkCryptoCortexColors.pink
    },
    even: {
      color: darkCryptoCortexColors.white
    },
    shadow: {
      width: 1.5,
      opacity: 1
    },
    filters: [{
      distance: 0,
      blur: 1,
      quantity: 5,
      color: '#ffffff'
    }]
  },
  linePlotter: {
    color: darkCryptoCortexColors.grey3,
    alpha: 0.9,
    width: 2,
    shadow: [{
      blur: 10,
      distance: 2,
      rotation: 0,
      color: darkCryptoCortexColors.blue9,
      alpha: 1,
      quality: 10
    }]
  },
  areaPlotter: {
    line: {
      color: darkCryptoCortexColors.grey3,
      alpha: 0.9,
      width: 2,
      shadow: [{
        blur: 10,
        distance: 2,
        rotation: 0,
        color: darkCryptoCortexColors.blue9,
        alpha: 1,
        quality: 10
      }]
    },
    // background-image: linear-gradient(180deg, rgba(118, 176, 205, 0.4) 0%, rgba(60, 110, 135, 0.4) 97%);
    area: {
      color: darkCryptoCortexColors.grey,
      alpha: 0.01,
      gradient: {
        direction: EGradientDirection.horizontal,
        colors: [[0, 'rgba(118, 176, 205, 0.4)'], [0.97, 'rgba(60, 110, 135, 0.4)']]
      }
    }
  }
};

const whiteCryptoCortexPriceChart = {
  background: {
    color: whiteCryptoCortexColors.white3,
    image: undefined,
    gradient: undefined,
    alpha: 1
  },
  XGrid: {
    mainGrid: {
      color: whiteCryptoCortexColors.blue,
      lineWidth: 1,
      alpha: 1
    },
    subGrid: {
      color: whiteCryptoCortexColors.blue,
      lineWidth: 0.5,
      alpha: 1
    }
  },
  YGrid: {
    mainGrid: {
      color: whiteCryptoCortexColors.blue,
      lineWidth: 1,
      alpha: 1
    },
    subGrid: {
      color: whiteCryptoCortexColors.blue,
      lineWidth: 0.5,
      alpha: 1
    }
  },
  XAxis: {
    label: {
      color: whiteCryptoCortexColors.blue1
    }
  },
  YAxis: {
    label: {
      color: whiteCryptoCortexColors.blue1
    }
  },
  loadHatch: {
    color: whiteCryptoCortexColors.blue,
    alpha: 0.1
  },
  legend: {
    color: whiteCryptoCortexColors.blue1
  },
  focusOnPoint: {
    color: whiteCryptoCortexColors.blue1
  },
  endPoint: {
    circle: {
      color: whiteCryptoCortexColors.green2,
      radius: 3,
      alpha: 1
    },
    blur: {
      color: whiteCryptoCortexColors.green2
    }
  },
  crosshair: {
    xAxisLabel: {
      background: {
        color: whiteCryptoCortexColors.blue2,
        alpha: 1
      },
      text: {
        color: whiteCryptoCortexColors.white
      }
    },
    yAxisLabel: {
      background: {
        color: whiteCryptoCortexColors.blue2,
        alpha: 1
      },
      text: {
        color: whiteCryptoCortexColors.white
      }
    },
    lines: {
      width: 1,
      color: whiteCryptoCortexColors.blue2,
      opacity: 1
    }
  },
  currentRateLabel: {
    background: {
      color: whiteCryptoCortexColors.blue2,
      alpha: 1
    },
    line: {
      color: whiteCryptoCortexColors.blue2,
      alpha: 1,
      width: 1
    },
    text: {
      eq: {
        color: whiteCryptoCortexColors.white
      },
      up: {
        color: whiteCryptoCortexColors.green
      },
      down: {
        color: whiteCryptoCortexColors.pink
      }
    }
  },
  barPlotter: {
    up: {
      color: whiteCryptoCortexColors.green2
    },
    down: {
      color: whiteCryptoCortexColors.pink
    },
    even: {
      color: whiteCryptoCortexColors.grey3
    },
    filters: [{
      distance: 0,
      blur: 1,
      quantity: 5,
      color: "#ffffff"
    }]
  },
  volumePlotter: {
    color: darkCryptoCortexColors.blue3,
    alpha: 0.5
  },
  candlestickPlotter: {
    up: {
      color: whiteCryptoCortexColors.green2
    },
    down: {
      color: whiteCryptoCortexColors.pink
    },
    even: {
      color: whiteCryptoCortexColors.grey3
    },
    shadow: {
      width: 1.5,
      opacity: 1
    },
    filters: [{
      distance: 0,
      blur: 1,
      quantity: 5,
      color: "#ffffff"
    }]
  },
  linePlotter: {
    color: whiteCryptoCortexColors.blue3,
    alpha: 0.9,
    width: 2,
    shadow: [{
      blur: 2,
      distance: 0,
      rotation: 0,
      color: whiteCryptoCortexColors.blue4,
      alpha: 0.5,
      quality: 5
    }]
  },
  areaPlotter: {
    line: {
      color: whiteCryptoCortexColors.blue5,
      alpha: 0.9,
      width: 2,
      shadow: [{
        blur: 1,
        distance: 5,
        rotation: 90,
        color: whiteCryptoCortexColors.blue6,
        alpha: 0.3,
        quality: 10
      }]
    },
    area: {
      color: whiteCryptoCortexColors.blue7,
      alpha: 0.24,
      gradient: undefined
    }
  }
};

const darkCryptoCortexTradeHistory = {
  background: {
    color: darkCryptoCortexColors.blue
  },
  quantity: {
    buy: {
      ceilPart: {
        color: darkCryptoCortexColors.white
      },
      decimalPart: {
        color: darkCryptoCortexColors.green
      },
      zeroPart: {
        color: darkCryptoCortexColors.grey
      }
    },
    sell: {
      ceilPart: {
        color: darkCryptoCortexColors.white
      },
      decimalPart: {
        color: darkCryptoCortexColors.pink
      },
      zeroPart: {
        color: darkCryptoCortexColors.grey
      }
    }
  },
  price: {
    buy: {
      color: darkCryptoCortexColors.green
    },
    sell: {
      color: darkCryptoCortexColors.pink
    }
  },
  hovered: {
    color: darkCryptoCortexColors.white,
    alpha: 0.1
  },
  time: {
    buy: {
      color: darkCryptoCortexColors.green
    },
    sell: {
      color: darkCryptoCortexColors.pink
    }
  },
  exchange: {
    color: darkCryptoCortexColors.white
  }
};

const whiteCryptoCortexTradeHistory = {
  background: {
    color: whiteCryptoCortexColors.white2
  },
  quantity: {
    buy: {
      ceilPart: {
        color: whiteCryptoCortexColors.grey
      },
      decimalPart: {
        color: whiteCryptoCortexColors.green
      },
      zeroPart: {
        color: whiteCryptoCortexColors.grey
      }
    },
    sell: {
      ceilPart: {
        color: whiteCryptoCortexColors.grey
      },
      decimalPart: {
        color: whiteCryptoCortexColors.pink
      },
      zeroPart: {
        color: whiteCryptoCortexColors.grey
      }
    }
  },
  price: {
    buy: {
      color: whiteCryptoCortexColors.green
    },
    sell: {
      color: whiteCryptoCortexColors.pink
    }
  },
  hovered: {
    color: whiteCryptoCortexColors.blue3,
    alpha: 0.1
  },
  time: {
    buy: {
      color: whiteCryptoCortexColors.green
    },
    sell: {
      color: whiteCryptoCortexColors.pink
    }
  },
  exchange: {
    color: darkCryptoCortexColors.black1
  }
};

const defaultColors = {
  green: rgb("#4da53c"),
  green2: rgb("#2bab3f"),
  red: rgb("#ff6939"),
  red2: rgb("#da4830"),
  white: rgb("#ffffff"),
  blue: rgb("#0c1d27"),
  blue2: rgb("#0c1d27"),
  grey: rgb("#a2a8ad"),
  grey2: rgb("#414c55"),
  grey3: rgb("#414c55"),
  grey4: rgb("#cdd2d5"),
  grey5: rgb("#b8b9b9")
};

const defaultDepthChart = {
  background: {
    color: defaultColors.blue2,
    gradient: void 0
  },
  plotter: {
    lineWidth: 4,
    buy: {
      line: {
        color: defaultColors.green,
        alpha: 0.4,
        shadow: []
      },
      area: {
        color: defaultColors.green,
        alpha: 0.4
      }
    },
    sell: {
      line: {
        color: defaultColors.red,
        alpha: 0.4,
        shadow: []
      },
      area: {
        color: defaultColors.red,
        alpha: 0.4
      }
    }
  },
  xAxis: {
    label: {
      color: defaultColors.grey5
    },
    background: {
      color: defaultColors.blue2
    }
  },
  yAxis: {
    label: {
      color: defaultColors.grey5
    }
  },
  tooltip: {
    buy: {
      color: defaultColors.green
    },
    sell: {
      color: defaultColors.red
    }
  },
  midPrice: {
    price: {
      color: defaultColors.grey2
    },
    label: {
      color: defaultColors.grey2
    },
    line: {
      color: defaultColors.grey2
    }
  }
};

const defaultOrderGrid = {
  background: {
    color: defaultColors.blue
  },
  quantity: {
    buy: {
      ceilPart: {
        color: defaultColors.white
      },
      decimalPart: {
        color: defaultColors.green
      },
      zeroPart: {
        color: defaultColors.grey
      }
    },
    sell: {
      ceilPart: {
        color: defaultColors.white
      },
      decimalPart: {
        color: defaultColors.red
      },
      zeroPart: {
        color: defaultColors.grey
      }
    }
  },
  price: {
    buy: {
      color: defaultColors.green
    },
    sell: {
      color: defaultColors.red
    }
  },
  exchange: {
    color: defaultColors.white
  },
  hovered: {
    color: defaultColors.white,
    alpha: 0.1
  },
  highlighted: {
    color: defaultColors.white,
    alpha: 0.1
  },
  spreadLine: {
    border: {
      color: defaultColors.grey4,
      alpha: 0.1
    },
    background: {
      color: defaultColors.blue
    },
    text: {
      color: defaultColors.white
    }
  }
};

const defaultPriceChart = {
  background: {
    color: defaultColors.blue,
    alpha: 1,
    image: undefined,
    gradient: undefined
  },
  XGrid: {
    mainGrid: {
      color: defaultColors.grey5,
      lineWidth: 1,
      alpha: undefined
    },
    subGrid: {
      color: defaultColors.grey5,
      lineWidth: 0.5,
      alpha: undefined
    }
  },
  YGrid: {
    mainGrid: {
      color: defaultColors.grey5,
      lineWidth: 1,
      alpha: undefined
    },
    subGrid: {
      color: defaultColors.grey5,
      lineWidth: 0.5,
      alpha: undefined
    }
  },
  XAxis: {
    label: {
      color: defaultColors.grey5
    }
  },
  YAxis: {
    label: {
      color: defaultColors.grey5
    }
  },
  loadHatch: {
    color: defaultColors.white,
    alpha: 0.1
  },
  legend: {
    color: defaultColors.white
  },
  focusOnPoint: {
    color: defaultColors.grey4
  },
  endPoint: {
    circle: {
      color: defaultColors.green2,
      radius: 3,
      alpha: 1
    },
    blur: {
      color: defaultColors.green2
    }
  },
  crosshair: {
    xAxisLabel: {
      background: {
        color: defaultColors.white,
        alpha: 0.5
      },
      text: {
        color: defaultColors.white
      }
    },
    yAxisLabel: {
      background: {
        color: defaultColors.white,
        alpha: 0.5
      },
      text: {
        color: defaultColors.white
      }
    },
    lines: {
      width: 0.5,
      color: defaultColors.white,
      opacity: 0.7
    }
  },
  currentRateLabel: {
    background: {
      color: defaultColors.white,
      alpha: 0.7
    },
    line: {
      color: defaultColors.white,
      alpha: 0.9,
      width: 1
    },
    text: {
      eq: {
        color: defaultColors.white
      },
      up: {
        color: defaultColors.green2
      },
      down: {
        color: defaultColors.red2
      }
    }
  },
  barPlotter: {
    up: {
      color: defaultColors.green2
    },
    down: {
      color: defaultColors.red2
    },
    even: {
      color: defaultColors.white
    },
    filters: undefined
  },
  volumePlotter: {
    color: defaultColors.green2,
    alpha: 0.5
  },
  candlestickPlotter: {
    up: {
      color: defaultColors.green2
    },
    down: {
      color: defaultColors.red2
    },
    even: {
      color: defaultColors.white
    },
    shadow: {
      width: 1.5,
      opacity: 1
    },
    filters: undefined
  },
  linePlotter: {
    color: defaultColors.grey5,
    alpha: 0.9,
    width: 1,
    shadow: []
  },
  areaPlotter: {
    line: {
      color: defaultColors.grey5,
      alpha: 0.9,
      width: 2,
      shadow: []
    },
    // background-image: linear-gradient(180deg, rgba(118, 176, 205, 0.4) 0%, rgba(60, 110, 135, 0.4) 97%);
    area: {
      color: defaultColors.grey5,
      alpha: 0.5,
      gradient: undefined
    }
  }
};

const defaultTradeHistory = {
  background: {
    color: defaultColors.blue
  },
  price: {
    buy: {
      color: defaultColors.green
    },
    sell: {
      color: defaultColors.red
    }
  },
  quantity: {
    buy: {
      ceilPart: {
        color: defaultColors.grey
      },
      decimalPart: {
        color: defaultColors.white
      },
      zeroPart: {
        color: defaultColors.grey2
      }
    },
    sell: {
      ceilPart: {
        color: defaultColors.grey
      },
      decimalPart: {
        color: defaultColors.white
      },
      zeroPart: {
        color: defaultColors.grey2
      }
    }
  },
  hovered: {
    color: defaultColors.white,
    alpha: 0.1
  },
  exchange: {
    color: defaultColors.blue
  },
  time: {
    buy: {
      color: defaultColors.grey3
    },
    sell: {
      color: defaultColors.grey3
    }
  }
};

const cryptoCortexWhite = {
  tradeHistory: whiteCryptoCortexTradeHistory,
  orderGrid: whiteCryptoCortexOrderGrid,
  depthChart: whiteCryptoCortexDepthChart,
  priceChart: whiteCryptoCortexPriceChart
};
const cryptoCortexDark = {
  tradeHistory: darkCryptoCortexTradeHistory,
  orderGrid: darkCryptoCortexOrderGrid,
  depthChart: darkCryptoCortexDepthChart,
  priceChart: darkCryptoCortexPriceChart
};
const defaultTheme = {
  tradeHistory: defaultTradeHistory,
  orderGrid: defaultOrderGrid,
  depthChart: defaultDepthChart,
  priceChart: defaultPriceChart
};
var EThemes;

(function (EThemes) {
  EThemes["default"] = "default";
  EThemes["cryptoCortexWhite"] = "cryptoCortexWhite";
  EThemes["cryptoCortexDark"] = "cryptoCortexDark";
})(EThemes || (EThemes = {}));

const multiAppThemes = {
  default: defaultTheme,
  cryptoCortexWhite,
  cryptoCortexDark
};

const getFormattedNumber = formattedNumber => {
  if (typeof formattedNumber === 'string') return formattedNumber;
  return `${formattedNumber.integerPart}${formattedNumber.fractionalPart ? formattedNumber.decimalSeparator : ''}${formattedNumber.fractionalPart}`;
};

const debugMode = () => {
  try {
    if (window) {
      return window.__debugMode || false;
    }
  } catch (_a) {// it's worker
  }

  return self.__debugMode || false;
};

const separator = "@";
const levelsOnScreen = 50;

const cache = new WeakMap();
const fontStyleCache = (common, tint) => {
  let map = cache.get(common);

  if (!map) {
    map = new Map();
    cache.set(common, map);
  }

  if (map.has(tint)) {
    return map.get(tint);
  }

  const obj = Object.assign(Object.assign({}, common), {
    tint,
    fill: tint
  });
  map.set(tint, obj);
  return obj;
};

export { EAggregationTypes, EThemes, commonFonts, debugMode, defaultTradeHistory, fontStyleCache, getFillColor, getFormattedNumber, isTTF, levelsOnScreen, multiAppThemes, noopDefaultFormatFunction, noopFormatFunction, robotoCondensedRegular10, robotoCondensedRegular16, robotoMonoRegular10, separator, ttfRobotoCondensed_regular_10 };
