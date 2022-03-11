var margin = { top: 80, right: 80, bottom: 80, left: 70 },
    width = 1400 - margin.left - margin.right,
    height = 700 - margin.top - margin.bottom;

// var parse = d3.time.format("%d-%m-%Y").parse;

// Scales and axes. Note the inverted domain for the y-scale: bigger is up!
var x = d3.time.scale().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    xAxis = d3.svg.axis().scale(x).tickSize(-height).tickSubdivide(true),
    yAxis = d3.svg.axis().scale(y).ticks(10).orient("right");

// An area generator, for the light fill.
var area = d3.svg.area()
    .interpolate("monotone")
    .x(function (d) { return x(d.date); })
    .y0(height)
    .y1(function (d) { return y(d.percentage); });

// A line generator, for the dark stroke.
var line = d3.svg.line()
    .interpolate("monotone")
    .x(function (d) { return x(d.date); })
    .y(function (d) { return y(d.percentage); });

fetch('/data_interactive.json')
    .then(res => res.text())
    .then((res) => {
        extractdata(JSON.parse(res).attendanceData);
    });


 function drawGraph(data) {

    // Filter to one symbol; the S&P 500.
    var values = data.filter(function (d) {
        return d.gender == "F";;
    });

    var msft = data.filter(function (d) {
        return d.gender == "M";
    });

    //   var ibm = data.filter(function(d) {
    //     return d.symbol == 'IBM';
    //   });

    //   var aapl = data.filter(function(d) {
    //     return d.symbol == 'AMZN';
    //   });



    // Compute the minimum and maximum date, and the maximum price.
    x.domain([values[0].date, values[values.length - 1].date]);
    y.domain([0, d3.max(values, function (d) { return d.percentage; })]).nice();

    // Add an SVG element with the desired dimensions and margin.
    var svg = d3.select("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    // Add the clip path.
    svg.append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", width)
        .attr("height", height);

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + width + ",0)")
        .call(yAxis);


    var colors = d3.scale.category10();
    svg.selectAll('.line')
        .data([values,msft])
        .enter()
        .append('path')
        .attr('class', 'line')
        .style('stroke', function (d) {
            return colors(Math.random() * 50);
        })
        .attr('clip-path', 'url(#clip)')
        .attr('d', function (d) {
            return line(d);
        })

    /* Add 'curtain' rectangle to hide entire graph */
    var curtain = svg.append('rect')
        .attr('x', -1 * width)
        .attr('y', -1 * height)
        .attr('height', height)
        .attr('width', width)
        .attr('class', 'curtain')
        .attr('transform', 'rotate(180)')
        .style('fill', '#ffffff')

    /* Optionally add a guideline */
    var guideline = svg.append('line')
        .attr('stroke', '#333')
        .attr('stroke-width', 0)
        .attr('class', 'guide')
        .attr('x1', 1)
        .attr('y1', 1)
        .attr('x2', 1)
        .attr('y2', height)

    /* Create a shared transition for anything we're animating */
    var t = svg.transition()
        .delay(750)
        .duration(16000)
        .ease('linear')
        .each('end', function () {
            d3.select('line.guide')
                .transition()
                .style('opacity', 0)
                .remove()
        });

     svg.selectAll('svg')
        .data(values)
        .enter()
        .append('circle')
        .attr("r" , 2)
        .attr('class', 'dot')
//        .style('fill','red')
        .style('width','100px')
        .style('height','100px')
        .attr("cx",function(d){return x(d.date);})
        .attr("cy",function(d){return y(d.percentage);});
        
        svg.selectAll('svg')
        .data(msft)
        .enter()
        .append('circle')
        .attr("r" , 2)
        .attr('class', 'dot')
        .attr("cx",function(d){return x(d.date);})
        .attr("cy",function(d){return y(d.percentage);});
        

    t.select('rect.curtain')
        .attr('width', 0);
    t.select('line.guide')
        .attr('transform', 'translate(' + width + ', 0)')

    d3.select("#show_guideline").on("change", function (e) {
        guideline.attr('stroke-width', this.checked ? 1 : 0);
        curtain.attr("opacity", this.checked ? 0.75 : 1);

        
    })


    svg.append("g")         
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(make_x_axis()
            .tickSize(-height, 0, 0)
            .tickFormat("")
        )

    svg.append("g")         
        .attr("class", "grid")
        .call(make_y_axis()
            .tickSize(-width, 0, 0)
            .tickFormat("")
        )

        function make_x_axis() {        
            return d3.svg.axis()
                .scale(x)
                 .orient("bottom")
                 .ticks(15)
        }
        
        function make_y_axis() {        
            return d3.svg.axis()
                .scale(y)
                .orient("left")
                .ticks(15)
        }
}

// Parse dates and numbers. We assume values are sorted by date.
function type(d) {
    d.date = d.date;
    d.percentage = +d.percentage;
    return d;
}
String.prototype.splice = function(offset, text, removeCount=0) {
    let calculatedOffset = offset < 0 ? this.length + offset : offset;
    return this.substring(0, calculatedOffset) +
      text + this.substring(calculatedOffset + removeCount);
  };

let datares = [];
let weekdataMale = [];
let count;
let attendanceCount;
let attendanceFemaleCount;
let date;
function extractdata(filterData) {
    datares = filterData.filter((e) => e.Status != "CC");
    for (let i = 2; i <= 13; i++) {
        for (let j = 1; j < 6; j++) { 
            count = 0;
            attendanceCount = 0;
            attendanceFemaleCount = 0;
            date = 0;
              datares.map((d) => { if(d.WeekNum == i && d.DayNum == j && d.Gender == "F" ){
                   count++;
                   date = d.classDateTime;
                   if(d.Status == "P" || d.Status == "PDG" || d.Status == "LAB" || d.Status == "O" ){
                        attendanceCount++; 
                   }
              }
            });
            date = date.substring(0,8).splice(6,"20")  ;   
            date =new Date(date.substring(6,10).concat(date.substring(2,5)).concat('-',date.substring(0,2)));
            
            weekdataMale.push({
                gender : "F",
                weekNum : i,
                dayNum : j,
                percentage : ((attendanceCount/count)*100).toFixed(2),
                date : date
            });

        }
    }
    for (let i = 2; i <= 13; i++) {
        for (let j = 1; j < 6; j++) { 
            count = 0;
            attendanceCount = 0;
            attendanceFemaleCount = 0;
            date = 0;
              datares.map((d) => { if(d.WeekNum == i && d.DayNum == j && d.Gender == "M"){
                   count++;
                   date = d.classDateTime;
                   if(d.Status == "P" || d.Status == "PDG" || d.Status == "LAB" || d.Status == "O" ){
                        attendanceCount++; 
                   }
              }
            });
            date = date.substring(0,8).splice(6,"20")  ;    
            date =new Date(date.substring(6,10).concat(date.substring(2,5)).concat('-',date.substring(0,2)));
            weekdataMale.push({
                gender : "M",
                weekNum : i,
                dayNum : j,
                percentage : ((attendanceCount/count)*100).toFixed(2),
                date : date
            });

        }
    }
    type(weekdataMale);
    drawGraph(weekdataMale);
    debugger;
}

$("body").on("mouseover",'.dot' ,function(event){
    debugger;
    $('#genderToolTip').text("GENDER :"+event.toElement.__data__.gender);
    $('#weekToolTip').text(" WEEK: "+event.toElement.__data__.weekNum);
    $('#dayToolTip').text(" DAY: "+ event.toElement.__data__.dayNum);
    $('#percentageToolTip').text(" PERCENTAGE "+ event.toElement.__data__.percentage);
    $(".tooltipTest").css({
        "left": event.pageX - 0,
        "top": event.pageY -70
    });
});
$('body').on("mouseout", '.dot', function (event) {
    $('#genderToolTip').text("");
    $('#weekToolTip').text(" ");
    $('#dayToolTip').text(" ");
    $('#percentageToolTip').text(" ");
    $(".tooltipTest").css({
        "left": 0,
        "top": 0
    });   
});