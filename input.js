import { csvToObj } from "csv-to-js-parser";
import fs from "fs";

// taking the input test cases from input csv
const testInputData = fs.readFileSync('testcases.csv').toString();

const testInputDescription = {
  from_line:  {type: "string", group:1},
  to_line:    {type: "string", group:1},
  time:       {type: "string", group:1}
}

let inpObj = csvToObj(testInputData, ',', testInputDescription);

// inpObj sorted with time
inpObj.sort((a,b)=> {return a.time < b.time})

export {inpObj}
