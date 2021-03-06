/*
    Dynamic D3 linechart for SAS Data-Driven Content objects

    Each row of input should be:
        - a string, e.g. a date
        - a binary category, {"B", "T"}
        - two continuous variables

    Plots two continuous variables and calculates a standard
    deviation over "B".
*/

// Sample data
var self = this;
var sampleData = {
    data: [
        ["2020-01-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-02-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-03-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-04-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-05-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-06-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-07-01", "B", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-08-01", "T", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-09-01", "T", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
        ["2020-10-01", "T", Math.floor(Math.random() * 11) + 95, Math.floor(Math.random() * 11) + 95],
    ]
};
var sampleColumnInfo = [
    { label: "date", type: "string" },
    { label: "flag", type: "string" },
    { label: "Variable 1", type: "number" },
    { label: "Variable 2", type: "number" },
];

// SVG settings
var svg = d3.select("svg"),
    margin = 100,
    width = window.innerWidth - margin,
    height = window.innerHeight - margin;

var xScale = d3.scalePoint().range([0, width]).padding(0.4),
    yScale = d3.scaleLinear().range([height, 0]);

function getStandardDeviation(array) {
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    return Math.sqrt(array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
}

// Draw simple bar chart
function drawChart(columnInfo, data) {
    // Clear old chart down
    svg.selectAll('*').remove();

    // Get variable names
    var xLabel = columnInfo[0].label,
        testLabel = columnInfo[1].label,
        y1Label = columnInfo[2].label,
        y2Label = columnInfo[3].label;

    // Calculate confidence limits
    var baseArray = data.filter((d) => d[testLabel] === 'B');
    var baseVal = baseArray.map((d) => { return d[y1Label] });
    var baseMean = baseVal.reduce((a, b) => a + b) / baseVal.length;
    var lowerLimit = baseMean - 1.96 * getStandardDeviation(baseVal),
        upperLimit = baseMean + 1.96 * getStandardDeviation(baseVal);

    // Get first test point for changing shading color
    var testStart = data.find((d) => d[testLabel] === 'T');

    // Calculate percent of range for padding
    var var1Vals = data.map(d => d[y1Label]),
        var2Vals = data.map(d => d[y2Label]),
        vals = var1Vals.concat(var2Vals).concat([lowerLimit, upperLimit]);
    var range = vals
        .reduce((a, b) => Math.max(a, b)) - vals.reduce((a, b) => Math.min(a, b));
    var rangePadding = range * 0.15;

    var g = svg.append("g")
        .attr("transform", "translate(" + margin / 2 + "," + margin / 2 + ")");

    // Scale X and Y
    xScale.domain(data.map(function (d) { return d[xLabel]; }));
    yScale.domain([
        d3.min(
            data, function (d) {
                return Math.min(
                    d[y1Label],
                    d[y2Label],
                    lowerLimit)
                    - rangePadding
            }
        ),
        d3.max(
            data, function (d) {
                return Math.max(
                    d[y1Label],
                    d[y2Label],
                    upperLimit
                ) + rangePadding
            }
        )
    ]);

    // Draw axes
    g.append("g")
        .attr("transform", "translate(" + 0 + "," + height + ")")
        .call(d3.axisBottom(xScale).tickFormat(function (d) {
            return d;
        }).ticks(10))
        .enter()
        .append("text")
        .attr("x", 6)
        .attr("dx", "0.71em")
        .attr("text-anchor", "middle")
        .text(xLabel);

    g.append("g")
        .call(d3.axisLeft(yScale).tickFormat(function (d) {
            return d;
        }).ticks(10))
        .enter()
        .append("text")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .attr("text-anchor", "end")
        .text(y1Label);

    // Draw limit lines
    g.append("path")
        .datum(data)
        .attr('class', 'line')
        .attr('class', 'limit-line')
        .attr('d', d3.line()
            .x(function (d) { return xScale(d[xLabel]); })
            .y(yScale(lowerLimit))
        );
    g.append("path")
        .datum(data)
        .attr('class', 'line')
        .attr('class', 'limit-line')
        .attr('d', d3.line()
            .x(function (d) { return xScale(d[xLabel]); })
            .y(yScale(upperLimit))
        );

    // Draw limit shading box
    g.append('rect')
        .attr('class', 'base-shading')
        .attr("x", xScale(data[0][xLabel]))
        .attr('y', yScale(upperLimit))
        .attr('width', xScale(testStart[xLabel]) - xScale(data[0][xLabel]))
        .attr('height', yScale(lowerLimit) - yScale(upperLimit));
    g.append('rect')
        .attr('class', 'test-shading')
        .attr("x", xScale(testStart[xLabel]))
        .attr('y', yScale(upperLimit))
        .attr('width', xScale(data[data.length - 1][xLabel]) - xScale(testStart[xLabel]))
        .attr('height', yScale(lowerLimit) - yScale(upperLimit));


    // Draw var2 line
    g.append("path")
        .datum(data)
        .attr('class', 'line')
        .attr('class', 'var2-line')
        .attr('d', d3.line()
            .x(function (d) { return xScale(d[xLabel]); })
            .y(function (d) { return yScale(d[y2Label]); })
        )
        .attr('height', function (d) { return height - yScale(d[y2Label]); })

    // Draw var1 line (on top of var2 line, so after)
    g.append("path")
        .datum(data)
        .attr('class', 'line')
        .attr('class', 'var1-line')
        .attr('d', d3.line()
            .x(function (d) { return xScale(d[xLabel]); })
            .y(function (d) { return yScale(d[y1Label]); })
        )
        .attr('height', function (d) { return height - yScale(d[y1Label]); })

    // Draw legend
    g.append('path')
        .datum([[width - 80, 15], [width - 120, 15]])
        .attr('class', 'line')
        .attr('class', 'var1-line')
        .attr('d', d3.line()
            .x(d => d[0])
            .y(d => d[1])
        )
    g.append('path')
        .datum([[width - 80, 35], [width - 120, 35]])
        .attr('class', 'line')
        .attr('class', 'var2-line')
        .attr('d', d3.line()
            .x(d => d[0])
            .y(d => d[1])
        )

    g.append('text')
        .attr('class', 'legend-text')
        .attr('x', width - 70)
        .attr('y', 20)
        .text(y1Label);

    g.append('text')
        .attr('class', 'legend-text')
        .attr('x', width - 70)
        .attr('y', 40)
        .text(y2Label);
};

// Retrieve data and begin processing
function onMessage(evt) {
    if (evt && evt.data) {
        var results = null;
        var columnInfo = null;

        self.resultName = evt.data.resultName;

        if (evt.data.availableRowCount >= 0 || evt.data != results) {
            results = evt.data;
            columnInfo = evt.data.columns;
        }
        else if (evt.data.availableRowCount == -1) {
            results = sampleData;
            columnInfo = sampleColumnInfo;
        }

        data = formatSASData(columnInfo, results);
        drawChart(columnInfo, data);
    }
}

// Convert data from SAS supplied format to D3 format
function formatSASData(c, d) {
    // Create a dict with columns from columnInfo and data rows
    dict = []

    // For each row of data
    for (i = 0; i < d.data.length; i++) {
        // Create dictionary of row mapped to column names
        row = d.data[i]
        row_dict = new Object;

        for (j = 0; j < row.length; j++) {
            row_dict[c[j].label] = row[j];
        }

        dict.push(row_dict);
    }

    return dict
}

// Fetch data and run process
if (window.addEventListener) {
    // For standards-compliant web browsers
    window.addEventListener("message", onMessage, false);
} else {
    window.attachEvent("onmessage", onMessage);
}

// DEBUG settings
// results = sampleData;
// columnInfo = sampleColumnInfo;
// data = formatSASData(columnInfo, results);
// drawChart(columnInfo, data);
