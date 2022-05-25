export declare class StageContext {
    themes: any;
    actualTheme: string;
    get theme(): {
        tradeHistory: {
            background: {
                color: number;
            };
            price: {
                buy: {
                    color: number;
                };
                sell: {
                    color: number;
                };
            };
            quantity: {
                buy: {
                    ceilPart: {
                        color: number;
                    };
                    decimalPart: {
                        color: number;
                    };
                    zeroPart: {
                        color: number;
                    };
                };
                sell: {
                    ceilPart: {
                        color: number;
                    };
                    decimalPart: {
                        color: number;
                    };
                    zeroPart: {
                        color: number;
                    };
                };
            };
            hovered: {
                color: number;
                alpha: number;
            };
            exchange: {
                color: number;
            };
            time: {
                buy: {
                    color: number;
                };
                sell: {
                    color: number;
                };
            };
        };
        orderGrid: {
            background: {
                color: number;
            };
            quantity: {
                buy: {
                    ceilPart: {
                        color: number;
                    };
                    decimalPart: {
                        color: number;
                    };
                    zeroPart: {
                        color: number;
                    };
                };
                sell: {
                    ceilPart: {
                        color: number;
                    };
                    decimalPart: {
                        color: number;
                    };
                    zeroPart: {
                        color: number;
                    };
                };
            };
            price: {
                buy: {
                    color: number;
                };
                sell: {
                    color: number;
                };
            };
            exchange: {
                color: number;
            };
            hovered: {
                color: number;
                alpha: number;
            };
            highlighted: {
                color: number;
                alpha: number;
            };
            spreadLine: {
                border: {
                    color: number;
                    alpha: number;
                };
                background: {
                    color: number;
                };
                text: {
                    color: number;
                };
            };
        };
        depthChart: {
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
        priceChart: {
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
    };
    constructor(themes: any);
}
