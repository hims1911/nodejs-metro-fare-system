import { csvToObj } from "csv-to-js-parser";
import fs from "fs";

// taking the stats data input
const data = fs.readFileSync('stats.csv').toString();

const description ={
    from_line:    {type: 'string', group:1},
    to_line:      {type: 'string', group:1},
    peak:         {type: 'number', group:1},
    non_peak:     {type: 'number', group:1},
    daily_cap:    {type: 'number', group:1},
    weekly_cap:   {type: 'number', group:1}
};

let StatsData = csvToObj(data, ',', description);

export {StatsData};