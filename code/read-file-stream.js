const fs = require("fs");

const filename = "data/agatha.txt";
const readable = fs.createReadStream(filename, {
  highWaterMark: 20 * 1024,
});

readable.on('data', (data) => {
   console.log(data);
   console.log('-'.repeat(80));
});
