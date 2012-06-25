var IGraphs = IGraphs || {}; // namespace for Insight Graphs

// Initialize global IGraphs variables here
IGraphs.init = function() {
    if (!IGraphs.has_called_init) {
        IGraphs.container = d3.select("#graphs");
        IGraphs.gmt = new RegExp("([a-zA-Z]{3,9})\\.? (\\d{1,2}), (\\d{4}), (((\\d{1,2})(:(\\d{1,2}))? ([ap]{1})\\.m\\.)|(midnight)|(noon))");
        IGraphs.hex_colour = new RegExp("^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$");
        IGraphs.has_called_init = true;
    }
};

IGraphs.hexToRGBA = function(hex, alpha) {
    m = IGraphs.hex_colour.exec(hex);
    return "rgba(" + parseInt(m[1],16) + ","
        + parseInt(m[2],16) + ","
        + parseInt(m[3],16) + ","
        + alpha + ")";
}

IGraphs.getColour = d3.scale.category20();

/*
 * Base Graph object
 */
IGraphs.Graph = function(title, width, height) {
    this.title = title;
    this.width = width;
    this.height = height;
    // sometimes different to width and height to make room for legend, etc.
    this.chart_width = width;
    this.chart_height = height;
    if (IGraphs.container) {
        this.chart = IGraphs.container.append("div")
            .append("svg:svg")
            .attr("class", "graph graph-" + this.title.toLowerCase())
            .attr("width", width)
            .attr("height", height);
        this.chart.append("svg:text")
            .attr("class", "title")
            .attr("text-anchor", "middle")
            .attr("transform", "translate(" + width/2 + "," + 20 + ")")
            .text(title);
    }
};

IGraphs.Graph.prototype = {
    constructor: IGraphs.Graph,
    draw: function() {
        // override in children
    },
    updateData: function() {
        // override in children
    },
    makeLegend: function(keys) {
        this.legend = this.chart.select(".legend");
        if (!this.legend[0][0])
            this.legend = this.chart.append("svg:g")
                .attr("class", "legend");
        var keys = this.legend.selectAll(".key").data(keys)
            .enter().append("svg:g")
            .attr("class", "key")
            .attr("transform", function(d, i) {
                return "translate(0," + i * 20 + ")";
            });
        keys.append("rect")
            .attr("width", 16)
            .attr("height", 16)
            .attr("stroke", "#CCCCCC")
            .attr("fill", function(d) { return IGraphs.getColour(d); });
        keys.append("text")
            .attr("class", "label")
            .attr("x", 24)
            .attr("dy", "1em")
            .text(String);
        var bbox = this.legend[0][0].getBBox();
        this.legend.attr("transform", "translate(" + (this.width - bbox.width - 16) 
            + "," + ((this.height - bbox.height) / 2) + ")");
        this.chart_width = this.width - bbox.width - 16;
    },
    selectKeyValue: function(table_id, key_column_index, value_column_index, aggregate_by_key) {
        this.data = this.selectTableData(
            table_id, 
            [key_column_index, value_column_index], 
            ['key', 'value'], 
            {value: parseFloat}
        );
        this.data.sort(function (a, b) { return a.key.localeCompare(b.key); });
        if (aggregate_by_key)
            this.aggregateBy('key', 'value');
    },
    aggregateBy: function(key, value) {
        var last_key = "";
        var last_object = undefined;
        var data = [];
        for (var i = 0; i < this.data.length; i++) {
            d = this.data[i];
            if (d[key] != last_key) {
                last_key = d[key];
                last_object = d;
                data.push(last_object);
            }
            else last_object[value] += d[value];
        }
        this.data = data;
    },
    selectTableData: function(table_id, column_indices, column_names, filters) {
        if (!filters)
            filters = {};
        var data = [];
        var rows = d3.selectAll("#" + table_id + " tbody tr");
        for (var i = 0; i < rows[0].length; i++) {
            var row = d3.select(rows[0][i]).selectAll("td, th");
            var r = {}
            for (var j = 0; j < column_indices.length; j++) {
                if (filters[column_names[j]])
                    r[column_names[j]] = filters[column_names[j]](row[0][column_indices[j]].innerText);
                else
                    r[column_names[j]] = row[0][column_indices[j]].innerText;
            }
            data.push(r);
        }
        return data;
    },
};

/*
 * PieChart object
 */
IGraphs.PieChart = function(title, width, height) {
    IGraphs.Graph.call(this, title, width, height);
    if (this.chart) {
        this.slices = this.chart.append("svg:g")
            .attr("class", "slices")
            .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
    }
    this.radius = width / 2 * 0.6;
    this.arc = d3.svg.arc()
        .startAngle(function(d){ return d.startAngle; })
        .endAngle(function(d){ return d.endAngle; })
        .innerRadius(this.radius/2)
        .outerRadius(this.radius);
};

IGraphs.PieChart.prototype = new IGraphs.Graph();
IGraphs.PieChart.prototype.constructor = IGraphs.PieChart;
IGraphs.PieChart.prototype.supr = IGraphs.Graph.prototype;

IGraphs.PieChart.prototype.updateData = function(table_id, key_column_index, value_column_index, aggregate_by_key) {
    this.selectKeyValue(table_id, key_column_index, value_column_index, aggregate_by_key);
};

IGraphs.PieChart.prototype.draw = function() {
    var pieHelper = d3.layout.pie().value(function(d) {return d.value;});
    var pieData = pieHelper(this.data);
    var total = 0;
    pieData = pieData.filter(function(element, index, array) {
        total += element.value;
        return (element.value > 0);
    });
    
    if (pieData.length > 0) {
        // assign local pointers to instance attributes
        var arc = this.arc;
        var radius = this.radius;
        // helper functions
        var alignText = function(d) {
            return (d.startAngle + d.endAngle)/2 > Math.PI ? "end" : "start";
        };
        var calcOffset = function(d) {
            var c = arc.centroid(d);
            var h = Math.sqrt(c[0]*c[0] + c[1]*c[1]);
            var r = radius + 16;
            return "translate(" + c[0]/h * r + "," + c[1]/h * r + ")";
        };       
        // create the svg elements
        this.chart.select(".title")
            .attr("transform", "translate(" + this.width/2 + "," + this.height/2 + ")");
        var slices = this.slices.selectAll("path").data(pieData);
        slices.enter().append("svg:g")
            .attr("class", "slice");
        slices.append("svg:path")
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .attr("fill", function(d, i) { return IGraphs.getColour(d.data.key); })
            .attr("d", this.arc);
        slices.append("svg:text")
            .attr("class", "label")
            .attr("text-anchor", alignText)
            .attr("transform", calcOffset)
            .text(function(d, i) { return d.data.key; });
        slices.append("svg:text")
            .attr("class", "value percentage")
            .attr("dy", "1.5em")
            .attr("text-anchor", alignText)
            .attr("transform", calcOffset)
            .text(function(d, i) { 
                var perc = d.data.value * 100.0 / total;
                perc = Math.round(perc * 10.0)/10.0;
                return perc + "%"; 
            });
        slices.exit().remove();
    }
};

/*
 * BarChart object
 */
IGraphs.BarChart = function(title, width, height) {
    IGraphs.Graph.call(this, title, width, height);
    if (this.chart) {
        this.measure = this.chart.append("svg:g")
            .attr("class", "measure");
        this.bars = this.chart.append("svg:g")
            .attr("class", "bars");
    }
};

IGraphs.BarChart.prototype = new IGraphs.Graph();
IGraphs.BarChart.prototype.constructor = IGraphs.BarChart;
IGraphs.BarChart.prototype.supr = IGraphs.Graph.prototype;

IGraphs.BarChart.prototype.updateData = function(table_id, key_column_index, value_column_index, aggregate_by_key) {
    this.selectKeyValue(table_id, key_column_index, value_column_index, aggregate_by_key);
    this.column_width = 0.66 * this.width / this.data.length;
};

IGraphs.BarChart.prototype.draw = function() {
    var max = 0;
    var column_width = this.column_width;
    var max = d3.max(this.data, function(d) { return d.value; })
    var height = this.height;
    var y = d3.scale.linear()
        .domain([0, max])
        .range([0, 0.66 * this.height]);
    var y_inverse = d3.scale.linear()
        .domain([0, max])
        .range([0, -0.66 * this.height]);
    // create measure lines and labels
    this.measure.attr("transform",
        "translate(" + this.column_width + "," + (this.height - 60) + ")");
    var ticks = Math.round(0.66 * this.height / (50 * 5)) * 5;
    ticks = y_inverse.ticks(ticks);
    this.measure.selectAll("line").data(ticks)
        .enter().append("line")
        .attr("x2", this.width - 2 * this.column_width)
        .attr("y1", y_inverse)
        .attr("y2", y_inverse)
        .style("stroke", "#CCCCCC");
    this.measure.selectAll(".rule").data(ticks)
        .enter().append("text")
        .attr("class", "value")
        .attr("x", -4)
        .attr("y", y_inverse)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(String);
    // create bars and labels
    this.bars.attr("transform", 
        "translate(" + (this.width - this.column_width * this.data.length)/2.0 + ",0)");
    var bars = this.bars.selectAll("rect").data(this.data);
    bars.enter().append("svg:g")
        .attr("class", "bar")
        .attr("transform", function(d, i) {
            return "translate(" + (i * column_width + i) + "," + (height - 60 - y(d.value)) + ")";
        });
    bars.append("rect")
        .attr("height", function(d) { return y(d.value);})
        .attr("width", this.column_width)
        .attr("fill", function(d) { return IGraphs.getColour(d.key); });
    bars.append("text")
        .attr("class", "value")
        .attr("text-anchor", "middle")
        .attr("dy", -8)
        .attr("dx", this.column_width/2)
        .text(function(d) { return d.value; });
    bars.append("svg:g")
        .attr("class", "label")
        .attr("transform", function(d) {
            return "translate(" + (column_width/2 ) + "," + (y(d.value) + 8) + ")"; })
        .append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-30)")
            .text(function(d) { return d.key; });
};

/*
 * XYChart object
 */
IGraphs.XYChart = function(title, width, height, domain_name, range_name) {
    IGraphs.Graph.call(this, title, width, height);
    this.domain_name = domain_name;
    this.range_name = range_name;
    if (this.chart) {
        this.measure = this.chart.append("svg:g")
            .attr("class", "measure");
        this.measure.append("svg:g")
            .attr("class", "domain");
        this.measure.append("svg:g")
            .attr("class", "range");
        this.ranges = this.chart.append("svg:g")
            .attr("class", "ranges");
    }
    this.width_fract = 0.8;
    this.height_fract = 0.7;
};

IGraphs.XYChart.prototype = new IGraphs.Graph();
IGraphs.XYChart.prototype.constructor = IGraphs.XYChart;
IGraphs.XYChart.prototype.supr = IGraphs.Graph.prototype;

// if use_count is false, range_column_index is required. key_column_index is optional.
IGraphs.XYChart.prototype.updateData = function(table_id, domain_column_index, use_count, key_column_index, range_column_index) {
    var data = undefined;
    var filter = function(val){
        var new_val = parseFloat(val);
        if (!new_val) {
            m = IGraphs.gmt.exec(val);
            new_val = m[1] + " " + m[2] + ", " + m[3] + " ";
            if (m[4] == "midnight")
                new_val += "00:00:00";
            else if (m[4] == "noon")
                new_val += "12:00:00";
            else
                new_val += (m[9] == 'a' || m[6] == '12' ? m[6] : parseInt(m[6]) + 12) 
                + ":" + (m[8] ? m[8] : "00") + ":00";
            new_val = new Date(new_val);
        }
        return new_val;
    }
    var indices = [domain_column_index];
    var names = ['x'];
    if (!use_count) {
        indices.push(range_column_index);
        names.push('y');
    }
    if (key_column_index) {
        indices.push(key_column_index);
        names.push('key');
    }
    data = this.selectTableData(table_id, indices, names, {'x':filter, 'y':filter});
    var new_data = {};
    if (key_column_index) {
        for (var i = 0; i < data.length; i++) {
            var d = data[i];
            if (!new_data[d.key])
                new_data[d.key] = [d];
            else
                new_data[d.key].push(d);
        }
    }
    else
        new_data = {'key':data};
    // sort data in ascending order on domain and calculate extent
    data = [];
    for (var key in new_data) {
        new_data[key].sort(function(a, b) { return a.x - b.x; });
        var extent_x = [new_data[key][0].x, new_data[key][new_data[key].length - 1].x];
        var extent_y = use_count ? [0, new_data[key].length] : d3.extent(new_data[key], function(d) { return d.y; });
        data.push({key: key, 
                  range: !use_count ? new_data[key] : new_data[key].map(
                    function(d, i){ d.y = i + 1; return d; m}),
                  min_x: extent_x[0],
                  max_x: extent_x[1],
                  min_y: extent_y[0],
                  max_y: extent_y[1]
        });
    }
    this.use_count = use_count;
    this.data = data;
    this.data.sort(function (a, b) { return a.key.localeCompare(b.key); });
};

IGraphs.XYChart.prototype.drawDomainAxis = function(scale, is_datetime, rotate_labels) {
    var ticks = Math.round(this.width_fract * this.chart_width / (50 * 5)) * 5;
    var domain = this.measure.select(".domain")
        .attr("transform", "translate(0," + (this.height_fract * this.chart_height + 16) + ")");
    domain = domain.selectAll("g").data(scale.ticks(ticks))
        .enter().append("svg:g")
        .attr("transform", function(d, i) {
            return "translate(" + scale(d, i) + ",0)";
        })
    domain.append("text")
        .attr("class", "value domain-value" + (is_datetime ? " datetime" : ""))
        .attr("text-anchor", (rotate_labels ? "end" : "middle"))
        .attr("transform", "rotate(" + (rotate_labels ? -30 : 0) + ")")
        .text(is_datetime ? scale.tickFormat(ticks) : String);
    domain.append("line")
        .attr("y1", -12)
        .attr("y2", -20)
        .style("stroke", "#CCCCCC")
        .style("stroke-width", 1)
    if (this.domain_name) { 
        this.measure.select(".domain").selectAll(".axis-label").data([this.domain_name])
            .enter().append("text")
            .attr("class", "label axis-label")
            .attr("transform", "translate("
                + this.width_fract * 0.5 * this.chart_width + "," 
                + ((1 - this.height_fract) * 0.5 * this.chart_height - 20) + ")")
            .attr("text-anchor", "middle")
            .text(String);
    }
};

IGraphs.XYChart.prototype.drawRangeAxis = function(scale, is_datetime) {
    var ticks = Math.round(this.height_fract * this.chart_height / (50 * 5)) * 5;
    var range = this.measure.select(".range");
    range.selectAll("line").data(scale.ticks(ticks))
        .enter().append("line")
        .attr("x2", (this.width_fract * this.chart_width))
        .attr("y1", scale)
        .attr("y2", scale)
        .style("stroke", "#CCCCCC");
    range.selectAll(".range-value").data(scale.ticks(ticks))
        .enter().append("text")
        .attr("class", "value range-value" + (is_datetime ? " datetime" : ""))
        .attr("x", -4)
        .attr("y", scale)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(is_datetime ? x.tickFormat(ticks) : String);
    if (this.range_name) { 
        range.selectAll(".axis-label").data([this.range_name])
            .enter().append("svg:g")
            .attr("class", "label axis-label")
            .attr("transform", "translate(" 
                + ((1 - this.height_fract) * -0.5 * this.chart_height + 20) + "," 
                + (this.height_fract * 0.5 * this.chart_height) + ")")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .text(String);
    }
};

/* connected = true to draw a linechart
 * stretch_over_domain = true to duplicate endpoints to fill the domain
 * piecewise = true to draw a step function
 * smooth = true to interpolate between data points (ignored if piecewise = true) */
IGraphs.XYChart.prototype.draw = function(connected, stretch_over_domain, piecewise, smooth) {
    var e_domain = [Number.MAX_VALUE, Number.MIN_VALUE];
    var e_range = [Number.MAX_VALUE, Number.MIN_VALUE];
    this.data.map(function (d, i) {
        if (d.min_x < e_domain[0]) e_domain[0] = d.min_x;
        if (d.max_x > e_domain[1]) e_domain[1] = d.max_x;
        if (d.min_y < e_range[0]) e_range[0] = d.min_y;
        if (d.max_y > e_range[1]) e_range[1] = d.max_y;
    });
    var domain_is_datetime = e_domain[0].constructor == Date;
    var range_is_datetime = e_range[0].constructor == Date;
    if (this.data.length > 1) 
        this.makeLegend(this.data.map(function(d) { return d.key; }));
    if (domain_is_datetime)
        var x = d3.time.scale().domain(e_domain).range([0, this.width_fract * this.chart_width]);
    else
        var x  = d3.scale.linear().domain(e_domain).range([0, this.width_fract * this.chart_width]);
    if (range_is_datetime)
        var y = d3.time.scale().domain(e_range).range([this.height_fract * this.chart_height, 0]);
    else
        var y  = d3.scale.linear().domain(e_range).range([this.height_fract * this.chart_height, 0]);
    var offset_fractX = (1 - this.width_fract) / 2.0;
    var offset_fractY = (1 - this.height_fract) / 2.0;
    this.ranges.attr("transform", "translate(" + offset_fractX * this.chart_width + "," + offset_fractY * this.chart_height + ")");
    var data = this.data;
    if (stretch_over_domain)
    {
        var use_count = this.use_count;
        data = data.map(function (d, i) {
            var new_obj = {key: d.key, range: d.range.slice()};
            new_obj.range.splice(0, 0, {key: d.key, x: e_domain[0], y: d.min_y});
            new_obj.range.push({key: d.key, x: e_domain[1], y: d.max_y});
            if (use_count)
                new_obj.range[0].y = 0;
            return new_obj;
        });
    } 
    if (connected) {
        var ranges = this.ranges.selectAll("path").data(data);
        ranges.enter().append("svg:path")
            .datum(function(d, i) { return d.range; })
            .attr("d", d3.svg.line()
                .interpolate(piecewise ? "step-after" : (smooth ? "basis" : "linear"))
                .x(function(d, i) { return x(d.x); })
                .y(function(d, i) { return y(d.y); }))
            .style("stroke", function(d, i) { return IGraphs.hexToRGBA(IGraphs.getColour(d[i].key), 1); })
            .style("stroke-width", 3)
            .style("fill", "none");
    }
    else {
        var radius = Math.min(Math.floor(this.height_fract * this.chart_height / (e_range[1] - e_range[0]) * 0.5), 6);
        var ranges = this.ranges.selectAll(".range").data(data);
        ranges.enter().append("svg:g")
            .attr("class", "range")
            .selectAll("circle").data(function(d, i) { return d.range; })
                .enter().append("circle")
                .attr("cx", function(d, i) { return x(d.x); })
                .attr("cy", function(d, i) { return y(d.y); })
                .attr("r", radius)
                .style("fill", function(d, i) { return IGraphs.hexToRGBA(IGraphs.getColour(d.key), 0.7); });
    }
    
    this.measure.attr("transform", "translate(" + offset_fractX * this.chart_width + "," + offset_fractY * this.chart_height + ")");
    this.drawRangeAxis(y, range_is_datetime);
    this.drawDomainAxis(x, domain_is_datetime, true);
};

/*
 * LineChart object
 */
IGraphs.LineChart = function(title, width, height) {
    IGraphs.XYChart.call(this, title, width, height, "", "");
};

IGraphs.LineChart.prototype = new IGraphs.XYChart();
IGraphs.LineChart.prototype.constructor = IGraphs.LineChart;
IGraphs.LineChart.prototype.supr = IGraphs.XYChart.prototype;

// piecewise = true to draw a step function, smooth = true to interpolate between data points (ignored if piecewise = true)
IGraphs.LineChart.prototype.draw = function(stretch_over_domain, piecewise, smooth) {
    this.supr.draw.call(this, true, stretch_over_domain, piecewise, smooth);
};

/*
 * Histogram object
 */
IGraphs.Histogram = function(title, width, height, domain_name) {
    IGraphs.XYChart.call(this, title, width, height, domain_name, "Amount");
};

IGraphs.Histogram.prototype = new IGraphs.XYChart();
IGraphs.Histogram.prototype.constructor = IGraphs.Histogram;
IGraphs.Histogram.prototype.supr = IGraphs.XYChart.prototype;

IGraphs.Histogram.prototype.updateData = function(table_id, domain_column_index, key_column_index) {
    this.supr.updateData.call(this, table_id, domain_column_index, true, key_column_index);
};

IGraphs.Histogram.prototype.aggregateBy = function(x_intervals) {
    this.data = this.data.map(function (d, i) {
        d.intervals = x_intervals.map(function (d) { return 0; });
        var interval = 0;
        d.max_interval = 0;
        for (var i = 0; i < d.range.length; i++) {
            if (d.range[i].x > x_intervals[interval][1]) {
                if (d.intervals[interval] > d.max_interval)
                    d.max_interval = d.intervals[interval];
                interval++;
            }
            d.intervals[interval]++;
        }
        return d;
    });
};

IGraphs.Histogram.prototype.draw = function() {
    if (this.data.length > 1)
        this.makeLegend(this.data.map(function(d) { return d.key; }));
    var min_x = d3.min(this.data, function(d) { return d.min_x; });
    var max_x = d3.max(this.data, function(d) { return d.max_x; });
    
    var offset_fractX = (1 - this.width_fract) / 2.0;
    var offset_fractY = (1 - this.height_fract) / 2.0;
    
    var domain_is_datetime = max_x.constructor == Date;
    if (domain_is_datetime) {
        min_x.setSeconds(1); min_x.setMinutes(0); min_x.setHours(0);
        max_x.setSeconds(59); max_x.setMinutes(59); max_x.setHours(23);
        if (max_x.getTime() - min_x.getTime() > 2592000000 * 1.2) {
            min_x.setDate(1); 
            max_x.setDate(new Date(max_x.getYear(), max_x.getMonth() + 1, 0).getDate()); // hacky but works for now
        }
        var x = d3.time.scale().domain([min_x, max_x]).range([0, this.width_fract * this.chart_width]);
    }
    else
        var x = d3.scale.linear().domain([min_x, max_x]).range([0, this.width_fract * this.chart_width]);
    var ticks = domain_is_datetime ? (max_x.getTime() - min_x.getTime() > 2592000000 * 1.2 ? d3.time.months : d3.time.weeks)
        : Math.round(this.width_fract * this.chart_width / (50 * 5)) * 5 / 2.0; // half as dense as a normal XYChart
    var x_intervals = x.ticks(ticks);
    x_intervals = x_intervals.map(function(d, i) {
        if (i == 0)
            return [min_x, d];
        else
            return [x_intervals[i-1], d];
    });
    if (x_intervals[x_intervals.length - 1][1] < max_x)
        x_intervals.push([x_intervals[x_intervals.length - 1][1], max_x]);
    
    this.aggregateBy(x_intervals);
    var max_y = d3.max(this.data, function(d) { return d.max_interval; });
    var y = d3.scale.linear().domain([0, max_y]).range([0, this.height_fract * this.chart_height]);
    var y_reverse = d3.scale.linear().domain([0, max_y]).range([this.height_fract * this.chart_height, 0]);
    var interval_length = this.width_fract * this.chart_width / x_intervals.length;
    var tick_format = domain_is_datetime ? 
        (ticks == d3.time.months ? function(d) { return d[0].toDateString().substr(4, 3); }
            : function(d) { return d[0].toDateString().substr(4, 6) + " - " + d[1].toDateString().substr(8, 2); })
        : function(d) { return d[0] + " - " + d[1]; };
    
    // define custom scale function that behaves like d3.scale
    function scale(d, i) { return (interval_length * i + interval_length * 0.5); }
    scale.ticks = function (){ return x_intervals; };
    scale.tickFormat = function (){ return tick_format; };
    
    this.measure.attr("transform", "translate(" + offset_fractX * this.chart_width + "," + offset_fractY * this.chart_height + ")");
    this.drawDomainAxis(scale, domain_is_datetime);
    this.drawRangeAxis(y_reverse, false);
    
    var bar_width = interval_length / (this.data.length + 2); // 2 bar space between intervals
    var height = this.chart_height;
    var fract = this.height_fract;
    this.chart.select(".ranges")
        .attr("transform", "translate(" + (offset_fractX * this.chart_width + bar_width) + "," + (offset_fractY * this.chart_height) + ")")
        .selectAll("g").data(this.data)
        .enter().append("svg:g").attr("class", "range")
        .attr("transform", function(d, i) {
            return "translate(" + (i * bar_width) + ",0)"; })
        .style("fill", function (d) { return IGraphs.getColour(d.key); })
        .selectAll("rect").data(function(d, i) { return d.intervals; })
        .enter().append("svg:rect")
            .attr("width", bar_width)
            .attr("height", function(d) { return y(d) == 0 ? 1 : y(d); })
            .attr("transform", function (d, i) { 
                return "translate(" + (i * interval_length) + ", " + (fract * height - (y(d) == 0 ? 1 : y(d))) + ")"
            });
};