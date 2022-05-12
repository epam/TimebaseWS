import { HdDate } from "../src/ts/hd-date";

const Benchmark = require("benchmark");

const suite = new Benchmark.Suite();

suite
    .add("parse hddate", function () {
        const hdDate = new HdDate("2010-10-10T12:15:00.100100100Z");
    })
    .add("parse date", function () {
        const date = new Date("2010-10-10T12:15:00.100100100Z");
    })
    // add listeners
    .on("cycle", function (event) {
        // tslint:disable-next-line:no-console
        console.log(String(event.target));
    })
    .on("complete", function () {
        // tslint:disable-next-line
    })
    // run async
    .run({ "async": true });