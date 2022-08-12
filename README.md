# nodejs-metro-fare-system

make sure you have node.js installed on your system.

```
npm i
```

once we have node_modules installed we can simply run the signma_assignment script
```
node sigma_assignment.js
```

Input Format/ Console Input :

```
from_line: Green
to_line: Green
peak: 2
non_peak: 1
daily_cap: 8
weekly_cap: 55
from_line: Red
to_line: Red
peak: 3
non_peak: 2
daily_cap: 12
weekly_cap: 70
from_line: Green
to_line: Red
peak: 4
non_peak: 3
daily_cap: 15
weekly_cap: 90
from_line: Red
to_line: Green
peak: 3
non_peak: 2
daily_cap: 15
weekly_cap: 90
```

Console Output:
```
Simplified Group  {
  '2021-13': [
    GG: { fair: 55, data: [Array] },
    GR: { fair: 3, data: [Array] },
    RR: { fair: 2, data: [Array] }
  ],
  '2021-14': [ GG: { fair: 18, data: [Array] } ]
}
total amount charged by Sigma Metro System  78
```
