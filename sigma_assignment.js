import moment from "moment";
import fs from "fs";
import { csvToObj } from "csv-to-js-parser";
import { json } from "stream/consumers";
// it will import the peak hours, non peak hours, daily cap, weekly cap obj
import { StatsData } from "./stats.js";
// it will import the test case objects
import { inpObj } from "./input.js";


// getFair will help us to calculate the fair
// start : "Red"
// end   : "Red"
// timestamp : 2021-03-21T07:58:30
// output : fair value (depending on the peak hours or non peak hours)
function getFair(start, end, timestamp) {
  let startEndObject = StatsData.find(element => element.from_line == start && element.to_line == end);
  var currentDay = moment(timestamp).add(1,"d").day();
  
  var format = "HH:mm:ss";
  let timeInput = moment(timestamp, format);

  if (currentDay > 0 && currentDay < 6) {
    var beforeTime = moment("2021-08-05T08:00:00",format),
    afterTime = moment("2021-08-05T10:00:00",format),
    secondBeforeTime = moment("16:30:00", format),
    secondAfterTime = moment("19:00:00",format);

    // if time lies in between peak hours
    if (timeInput.isBetween(beforeTime, afterTime) || timeInput.isBetween(secondBeforeTime, secondAfterTime)) {
      return startEndObject.peak;
    } else {
      return startEndObject.non_peak;
    }
  } else if(currentDay == 6) {
    var beforeTime = moment('10:00:00', format),
    afterTime = moment('14:00:00', format),
    secondBeforeTime = moment("18:00:00", format),
    secondAfterTime = moment("23:00:00",format);
    // if time lies in between peak hours
    if ((timeInput.isBetween(beforeTime, afterTime)) || (timeInput.isBetween(secondBeforeTime, secondAfterTime))) {
      return startEndObject.peak;
    } else {
      return startEndObject.non_peak;
    }
  } else {
    var beforeTime = moment('18:00:00', format),
    afterTime = moment('23:00:00', format);
    // if time lies in between peak hours
    if (timeInput.isBetween(beforeTime, afterTime)) {
      return startEndObject.peak;
    } else {
      return startEndObject.non_peak;
    }
  }
}

// GetDailyCap will return the DailyCap Value for the Lines
function GetDailyCap(start, end) {
  let startEndObject = StatsData.find(element => element.from_line == start && element.to_line == end);
  return startEndObject.daily_cap
}

// GetWeeklyCap will return the DailyCap Value for the Lines
function GetWeeklyCap(start, end) {
  let startEndObject = StatsData.find(element => element.from_line == start && element.to_line == end);
  return startEndObject.weekly_cap
}


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
  
  let fair = getFair(input.from_line, input.to_line, input.time)
  
  acc[yearWeek][color_band].data[key].data.push(input.time); 

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

console.log("groups has been generated :", JSON.stringify(groups));



// calculating the results
let result = 0;

// traversing the group and fetching the value for the same
for (let entry of Object.entries(groups)) {
  result += (entry[1]["GG"]?.fair || 0);
  result += (entry[1]["GR"]?.fair || 0);
  result += (entry[1]["RG"]?.fair || 0);
  result += (entry[1]["RR"]?.fair || 0);
}

console.log("total amount charged by Sigma Metro System ", result);


