const fs = require('fs');
const path = require('path');
let file = path.resolve(
  __dirname,
  '../node_modules/ag-grid-community/dist/lib/filter/provided/date/dateFilter.d.ts',
);
let content = fs.readFileSync(file, 'utf-8');
fs.writeFileSync(
  file,
  content.replace(
    /(import \{ IDateComparatorFunc \} from \"\.\/dateFilter\";)/g,
    '// $1',
  ),
  'utf-8',
);

// file = path.resolve(
//   __dirname,
//   '../node_modules/ag-grid-community/src/ts/filter/provided/date/dateFilter.ts',
// );
// content = fs.readFileSync(file, 'utf-8');
// fs.writeFileSync(
//   file,
//   content.replace(
//     /(import \{ IDateComparatorFunc \} from \"\.\/dateFilter\";)/g,
//     '// $1',
//   ),
//   'utf-8',
// );
