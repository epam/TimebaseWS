export declare enum Format {
    "MM-DD-YY HH-mm-SS" = 0,
    "HH-mm-SS" = 1
}
export declare const formatTime: (time: number, format: Format) => string;
