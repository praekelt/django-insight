var IGraphs = IGraphs || {}; // namespace for Insight Graphs

// Initialize global IGraphs variables here
IGraphs.init = function() {
    if (!IGraphs.has_called_init) {
        IGraphs.container = d3.select("#graphs");
        IGraphs.gmt = new RegExp("([a-zA-Z]{3,9})\\.? (\\d{1,2}), (\\d{4}), (\\d{1,2})(:(\\d{1,2}))? ([ap]{1})\\.m\\.");
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
    },
    selectKeyValue: function(table_id, key_column_index, value_column_index) {
        this.data = this.selectTableData(
            table_id, 
            [key_column_index, value_column_index], 
            ['key', 'value']
        );
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

IGraphs.PieChart.prototype.updateData = function(table_id, key_column_index, value_column_index) {
    this.selectKeyValue(table_id, key_column_index, value_column_index);
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
            .text(function(d, i) { return (d.data.value * 100.0 / total + "%"); });
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

IGraphs.BarChart.prototype.updateData = function(table_id, key_column_index, value_column_index) {
    this.selectKeyValue(table_id, key_column_index, value_column_index);
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
            new_val = new Date(m[1] + " " + m[2] + ", " + m[3] + " "
                + (m[7] == 'a' || m[4] == '12' ? m[4] : parseInt(m[4]) + 12) + ":"
                + (m[6] ? m[6] : "00") + ":00");
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
    // sort data in ascending order on domain
    data = [];
    for (var key in new_data) {
        new_data[key].sort(function(a, b) { return a.x - b.x; });
        data.push({key: key, range: !use_count ? new_data[key] : new_data[key].map(
            function(d, i){ d.y = i + 1; return d; })
        });
    }
    this.use_count = use_count;
    this.data = data;
};

/* connected = true to draw a linechart
 * stretch_over_domain = true to duplicate endpoints to fill the domain
 * piecewise = true to draw a step function
 * smooth = true to interpolate between data points (ignored if piecewise = true) */
IGraphs.XYChart.prototype.draw = function(connected, stretch_over_domain, piecewise, smooth) {
    var e_domain = [];
    var e_range = this.use_count ? [0] : [];
    this.data.map(function (d, i) {
        var extent = d3.extent(d.range, function (d, i) {
            return d.x;
        });
        d.minX = extent[0];
        d.maxX = extent[1];
        e_domain.push.apply(e_domain, extent);
        extent = d3.extent(d.range, function (d, i) {
            return d.y;
        });
        d.minY = extent[0];
        d.maxY = extent[1];
        e_range.push.apply(e_range, extent);
    });
    var domain_is_datetime = e_domain[0].constructor == Date;
    var range_is_datetime = e_range[0].constructor == Date;
    e_domain = d3.extent(e_domain);
    e_range = d3.extent(e_range);
    var chartspaceX = this.width;
    if (this.data.length > 1) {
        this.makeLegend(this.data.map(function(d) { return d.key; }));
        var bbox = this.legend[0][0].getBBox();
        this.legend.attr("transform", "translate(" + (this.width - bbox.width - 16) 
            + "," + ((this.height - bbox.height) / 2) + ")");
        chartspaceX = this.width - bbox.width - 16;
    }
    var fractX = 0.8;
    var fractY = 0.7;
    if (domain_is_datetime)
        var x = d3.time.scale().domain(e_domain).range([0, fractX * chartspaceX]);
    else
        var x  = d3.scale.linear().domain(e_domain).range([0, fractX * chartspaceX]);
    if (range_is_datetime)
        var y = d3.time.scale().domain(e_range).range([fractY * this.height, 0]);
    else
        var y  = d3.scale.linear().domain(e_range).range([fractY * this.height, 0]);
    var offset_fractX = (1 - fractX) / 2.0;
    var offset_fractY = (1 - fractY) / 2.0;
    this.ranges.attr("transform", "translate(" + offset_fractX * chartspaceX + "," + offset_fractY * this.height + ")");
    var data = this.data;
    if (stretch_over_domain)
    {
        var use_count = this.use_count;
        data = data.map(function (d, i) {
            var new_obj = {key: d.key, range: d.range.slice()};
            new_obj.range.splice(0, 0, {key: d.key, x: e_domain[0], y: d.minY});
            new_obj.range.push({key: d.key, x: e_domain[1], y: d.maxY});
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
        var radius = Math.floor(fractY * this.height / (e_range[1] - e_range[0]) * 0.5);
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
    this.measure.attr("transform", "translate(" + offset_fractX * chartspaceX + "," + offset_fractY * this.height + ")");
    var ticks = Math.round(fractY * this.height / (50 * 5)) * 5;
    y.range([fractY * this.height,0]);
    var m_range = this.measure.select(".range");
    m_range.selectAll("line").data(y.ticks(ticks))
        .enter().append("line")
        .attr("x2", (offset_fractX + fractX * chartspaceX))
        .attr("y1", y)
        .attr("y2", y)
        .style("stroke", "#CCCCCC");
    m_range.selectAll(".range-value").data(y.ticks(ticks))
        .enter().append("text")
        .attr("class", "value range-value" + (range_is_datetime ? " datetime" : ""))
        .attr("x", -4)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(range_is_datetime ? x.tickFormat(ticks) : String);
    if (this.range_name) { 
        m_range.selectAll(".axis-label").data([this.range_name])
            .enter().append("svg:g")
            .attr("class", "label axis-label")
            .attr("transform", "translate(" + (-offset_fractY * this.height + 20) + "," + (fractY * 0.5 * this.height) + ")")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("transform", "rotate(-90)")
                .text(String);
    }
    ticks = Math.round(fractX * chartspaceX / (50 * 5)) * 5;
    var domain_group = this.measure.select(".domain")
        .attr("transform", "translate(0," + (fractY * this.height + 16) + ")");
    domain_group = domain_group.selectAll("g").data(x.ticks(ticks))
        .enter().append("svg:g")
        .attr("transform", function(d, i) {
            return "translate(" + x(d) + ",0)";
        })
    domain_group.append("text")
        .attr("class", "value domain-value" + (domain_is_datetime ? " datetime" : ""))
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-30)")
        .text(domain_is_datetime ? x.tickFormat(ticks) : String);
    domain_group.append("line")
        .attr("y1", -12)
        .attr("y2", -20)
        .style("stroke", "#CCCCCC")
        .style("stroke-width", 1)
    if (this.domain_name) { 
        this.measure.select(".domain").selectAll(".axis-label").data([this.domain_name])
            .enter().append("text")
            .attr("class", "label axis-label")
            .attr("transform", "translate(" + (0.5 - offset_fractX) * chartspaceX + "," + (offset_fractY * this.height - 20) + ")")
            .attr("text-anchor", "middle")
            .text(String);
    }
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