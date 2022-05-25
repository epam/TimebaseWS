export declare const defaultPriceChart: {
    background: {
        color: number;
        alpha: number;
        image: any;
        gradient: any;
    };
    XGrid: {
        mainGrid: {
            color: number;
            lineWidth: number;
            alpha: any;
        };
        subGrid: {
            color: number;
            lineWidth: number;
            alpha: any;
        };
    };
    YGrid: {
        mainGrid: {
            color: number;
            lineWidth: number;
            alpha: any;
        };
        subGrid: {
            color: number;
            lineWidth: number;
            alpha: any;
        };
    };
    XAxis: {
        label: {
            color: number;
        };
    };
    YAxis: {
        label: {
            color: number;
        };
    };
    loadHatch: {
        color: number;
        alpha: number;
    };
    legend: {
        color: number;
    };
    focusOnPoint: {
        color: number;
    };
    endPoint: {
        circle: {
            color: number;
            radius: number;
            alpha: number;
        };
        blur: {
            color: number;
        };
    };
    crosshair: {
        xAxisLabel: {
            background: {
                color: number;
                alpha: number;
            };
            text: {
                color: number;
            };
        };
        yAxisLabel: {
            background: {
                color: number;
                alpha: number;
            };
            text: {
                color: number;
            };
        };
        lines: {
            width: number;
            color: number;
            opacity: number;
        };
    };
    currentRateLabel: {
        background: {
            color: number;
            alpha: number;
        };
        line: {
            color: number;
            alpha: number;
            width: number;
        };
        text: {
            eq: {
                color: number;
            };
            up: {
                color: number;
            };
            down: {
                color: number;
            };
        };
    };
    barPlotter: {
        up: {
            color: number;
        };
        down: {
            color: number;
        };
        even: {
            color: number;
        };
        filters: any;
    };
    volumePlotter: {
        color: number;
        alpha: number;
    };
    candlestickPlotter: {
        up: {
            color: number;
        };
        down: {
            color: number;
        };
        even: {
            color: number;
        };
        shadow: {
            width: number;
            opacity: number;
        };
        filters: any;
    };
    linePlotter: {
        color: number;
        alpha: number;
        width: number;
        shadow: any[];
    };
    areaPlotter: {
        line: {
            color: number;
            alpha: number;
            width: number;
            shadow: any[];
        };
        area: {
            color: number;
            alpha: number;
            gradient: any;
        };
    };
};
export declare type PriceChartTheme = typeof defaultPriceChart;
