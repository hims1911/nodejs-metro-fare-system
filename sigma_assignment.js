import moment from "moment";
import fs from "fs";
import { csvToObj } from "csv-to-js-parser";
import { json } from "stream/consumers";
import { inpObj } from "./input.js";
import readline from "readline"
import prompt from "prompt"

// Input Test Case
// from_line,to_line,peak,non_peak,daily_cap,weekly_cap
// Green,Green,2,1,8,55
// Red,Red,3,2,12,70
// Green,Red,4,3,15,90
// Red,Green,3,2,15,90

let StatsData = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const ask = (question) => {
  return new Promise((resolve, reject) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  })
}

const main = async () => {
  let questions = ["from_line: ", "to_line: ", "peak: ", "non_peak: ", "daily_cap: ", "weekly_cap: "];
  for (let q = 0; q < 4; q++) {
    let ans = {}
    for (let i = 0; i < 6; i++)
      await ask(questions[i]).then(answer => {
        if (questions[i] == "from_line: " || questions[i] == "to_line: ") {
          ans[questions[i].replace(': ', '')] = titleCase(answer);
        } else {
          ans[questions[i].replace(': ', '')] = parseInt(answer, 10);
        }

      });
    StatsData.push(ans);
  }
  rl.close();

  // generating the stats
  let groups = CreateGroup();
  console.log("Simplified Group ", groups);

  // calculating the results
  let results = 0;

  // traversing the group and fetching the value for the same
  for (let entry of Object.entries(groups)) {
    results += (entry[1]["GG"]?.fair || 0);
    results += (entry[1]["GR"]?.fair || 0);
    results += (entry[1]["RG"]?.fair || 0);
    results += (entry[1]["RR"]?.fair || 0);
  }

  console.log("total amount charged by Sigma Metro System ", results);
}

main();



// getFair will help us to calculate the fair
// start : "Red"
// end   : "Red"
// timestamp : 2021-03-21T07:58:30
// output : fair value (depending on the peak hours or non peak hours)
function getFair(start, end, timestamp) {
  let startEndObject = StatsData.find(element => element['from_line'] == start && element['to_line'] == end);

  var currentDay = moment(timestamp).add(1, "d").day();

  var format = "HH:mm:ss";
  let timeInput = moment(timestamp, format);

  if (currentDay > 0 && currentDay < 6) {
    var beforeTime = moment("2021-08-05T08:00:00", format),
      afterTime = moment("2021-08-05T10:00:00", format),
      secondBeforeTime = moment("16:30:00", format),
      secondAfterTime = moment("19:00:00", format);

    // if time lies in between peak hours
    if (timeInput.isBetween(beforeTime, afterTime) || timeInput.isBetween(secondBeforeTime, secondAfterTime)) {
      return startEndObject['peak'];
    } else {
      return startEndObject['non_peak'];
    }
  } else if (currentDay == 6) {
    var beforeTime = moment('10:00:00', format),
      afterTime = moment('14:00:00', format),
      secondBeforeTime = moment("18:00:00", format),
      secondAfterTime = moment("23:00:00", format);
    // if time lies in between peak hours
    if ((timeInput.isBetween(beforeTime, afterTime)) || (timeInput.isBetween(secondBeforeTime, secondAfterTime))) {
      return startEndObject['peak'];
    } else {
      return startEndObject['non_peak'];
    }
  } else {
    var beforeTime = moment('18:00:00', format),
      afterTime = moment('23:00:00', format);
    // if time lies in between peak hours
    if (timeInput.isBetween(beforeTime, afterTime)) {
      return startEndObject['peak'];
    } else {
      return startEndObject['non_peak'];
    }
  }
}

// creating Simpler Format 
// {
//   '2021-13': [
//     GG: { fair: 55, data: [Array] },
//     GR: { fair: 3, data: [Array] },
//     RR: { fair: 2, data: [Array] }
//   ],
//   '2021-14': [ GG: { fair: 18, data: [Array] } ]
// }
function CreateGroup() {

  // generating the groups by yeark-week data
  const groups = inpObj.reduce((acc, input) => {

    // create a composed key: 'year-week'
    let yearWeek = "";
    if (moment(input.time).month() === 11 && moment(input.time).week() === 1) {
      yearWeek = `${moment(input.time).add(1, "y").year()}-${moment(input.time).week()}`;
    } else {
      yearWeek = `${moment(input.time).year()}-${moment(input.time).week()}`;
    }

    // add this key as a property to the result object
    if (!acc[yearWeek]) {
      acc[yearWeek] = [];
    }

    // push the current date that belongs to the year-week calculated before
    let color_band = input.from_line[0] + input.to_line[0]
    if (!acc[yearWeek][color_band])
      acc[yearWeek][color_band] = {
        fair: 0,
        data: []
      };

    let key = moment(input.time).format("YYYY-MM-DD");

    if (!acc[yearWeek][color_band].data[key])
      acc[yearWeek][color_band].data[key] = {
        fair: 0,
        data: []
      };

    // calculating daily fair
    let fair = getFair(input.from_line, input.to_line, input.time);
    acc[yearWeek][color_band].data[key].data.push(input.time);

    // calculating daily cap
    let daily_cap = GetDailyCap(input.from_line, input.to_line);

    if ((acc[yearWeek][color_band].data[key].fair + fair) > daily_cap) {
      acc[yearWeek][color_band].data[key].fair = daily_cap;
    } else {
      acc[yearWeek][color_band].data[key].fair += fair;
    }

    // 55 is weekly cap
    // currently we have 53 + 3 = 56
    // 53 + 2 = 55
    // 53 + 1 = 54
    let weekly_cap = GetWeeklyCap(input.from_line, input.to_line);

    if (acc[yearWeek][color_band].fair + fair > weekly_cap) {
      acc[yearWeek][color_band].fair = weekly_cap;
    } else {
      acc[yearWeek][color_band].fair += fair;
    }

    return acc;
  }, {});
  return groups;
}


// GetDailyCap will return the DailyCap Value for the Lines
function GetDailyCap(start, end) {
  let startEndObject = StatsData.find(element => element['from_line'] == start && element['to_line'] == end);
  return startEndObject['daily_cap']
}


// GetWeeklyCap will return the DailyCap Value for the Lines
function GetWeeklyCap(start, end) {
  let startEndObject = StatsData.find(element => element['from_line'] == start && element['to_line'] == end);
  return startEndObject['weekly_cap']
}

function titleCase(string) {
  return string[0].toUpperCase() + string.slice(1).toLowerCase();
}




