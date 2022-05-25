export declare const defaultDepthChart: {
    background: {
        color: number;
        gradient: any;
    };
    plotter: {
        lineWidth: number;
        buy: {
            line: {
                color: number;
                alpha: number;
                shadow: any[];
            };
            area: {
                color: number;
                alpha: number;
            };
        };
        sell: {
            line: {
                color: number;
                alpha: number;
                shadow: any[];
            };
            area: {
                color: number;
                alpha: number;
            };
        };
    };
    xAxis: {
        label: {
            color: number;
        };
        background: {
            color: number;
        };
    };
    yAxis: {
        label: {
            color: number;
        };
    };
    tooltip: {
        buy: {
            color: number;
        };
        sell: {
            color: number;
        };
    };
    midPrice: {
        price: {
            color: number;
        };
        label: {
            color: number;
        };
        line: {
            color: number;
        };
    };
};
export declare type DepthChartTheme = typeof defaultDepthChart;
