var IGraphs = IGraphs || {}; // namespace for Insight Graphs

// Initialize global IGraphs variables here
IGraphs.init = function() {
    if (!IGraphs.has_called_init) {
        IGraphs.container = d3.select("#graphs");
        IGraphs.gmt = new RegExp("([a-zA-Z]{3,9}) (\\d{1,2}), (\\d{4}), (\\d{1,2})(:(\\d{1,2}))? ([ap]{1})\\.m\\.");
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
    this.slices = this.chart.append("svg:g")
        .attr("class", "slices")
        .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
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
    var getColour = d3.scale.category20();
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
            .attr("fill", function(d, i) { return getColour(d.data.key); })
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
    this.measure = this.chart.append("svg:g")
        .attr("class", "measure");
    this.bars = this.chart.append("svg:g")
        .attr("class", "bars");
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
    var getColour = d3.scale.category20(); 
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
        .attr("fill", function(d) { return getColour(d.key); });
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
 * LineChart object
 */
IGraphs.LineChart = function(title, width, height, domain_name, range_name) {
    IGraphs.Graph.call(this, title, width, height);
    this.domain_name = domain_name;
    this.range_name = range_name;
    this.measure = this.chart.append("svg:g")
        .attr("class", "measure");
    this.measure.append("svg:g")
        .attr("class", "domain");
    this.measure.append("svg:g")
        .attr("class", "range");
    this.lines = this.chart.append("svg:g")
        .attr("class", "lines");
};

IGraphs.LineChart.prototype = new IGraphs.Graph();
IGraphs.LineChart.prototype.constructor = IGraphs.LineChart;
IGraphs.LineChart.prototype.supr = IGraphs.Graph.prototype;

// if use_count is false, range_column_index is required. key_column_index is optional.
IGraphs.LineChart.prototype.updateData = function(table_id, domain_column_index, use_count, key_column_index, range_column_index) {
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
        data.push({key: key, range: new_data[key]});
    }
        
    // if no y values specified, use count as y
    this.use_count = use_count;
    this.data = data;
};

// piecewise = true to draw a step function, smooth = true to interpolate between data points (only valid if piecewise = false)
IGraphs.LineChart.prototype.draw = function(piecewise, smooth) {
    var e_domain = [];
    var e_range = this.use_count ? [0] : [];
    this.data.map(function (d, i) { 
        e_domain.push.apply(e_domain, d3.extent(d.range, function (d, i) {
            return d.x;
        }));
        if (!d.range[0].y)
            e_range.push(d.range.length);
        else {
            e_range.push.apply(e_range, d3.extent(d.range, function (d, i) {
                return d.y;
            }));
        }
    });
    var domain_is_datetime = e_domain[0].constructor == Date;
    var range_is_datetime = e_range[0].constructor == Date;
    if (domain_is_datetime)
        var x = d3.time.scale().domain(d3.extent(e_domain)).range([0, 0.66 * this.width]);
    else
        var x  = d3.scale.linear().domain(d3.extent(e_domain)).range([0, 0.66 * this.width]);
    if (range_is_datetime)
        var y = d3.time.scale().domain(d3.extent(e_range)).range([0.66 * this.height, 0]);
    else
        var y  = d3.scale.linear().domain(d3.extent(e_range)).range([0.66 * this.height, 0]);
    var getColour = d3.scale.category20();
    var offset_frac = (1 - 0.66) / 2.0;
    this.lines.attr("transform", "translate(" + offset_frac * this.width + "," + offset_frac * this.height + ")");
    var lines = this.lines.selectAll("path.line").data(this.data);
    lines.enter().append("svg:path")
        .datum(function(d, i) { return d.range; })
        .attr("d", d3.svg.line()
            .interpolate(piecewise ? "step-after" : (smooth ? "basis" : "linear"))
            .x(function(d, i) { return x(d.x); })
            .y(function(d, i) { return d.y ? y(d.y) : y(i + 1); }))
        .style("stroke", function(d, i) { return IGraphs.hexToRGBA(getColour(d[i].key), 1); })
        .style("stroke-width", 3)
        .style("fill", "none");
    this.measure.attr("transform", "translate(" + offset_frac * this.width + "," + offset_frac * this.height + ")");
    var ticks = Math.round(0.66 * this.height / (50 * 5)) * 5;
    y.range([0.66 * this.height,0]);
    this.measure.select(".range").selectAll("line").data(y.ticks(ticks))
        .enter().append("line")
        .attr("x2", (offset_frac + 0.66 * this.width))
        .attr("y1", y)
        .attr("y2", y)
        .style("stroke", "#CCCCCC");
    this.measure.select(".range").selectAll(".range-value").data(y.ticks(ticks))
        .enter().append("text")
        .attr("class", "value range-value" + (range_is_datetime ? " datetime" : ""))
        .attr("x", -4)
        .attr("y", y)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(range_is_datetime ? x.tickFormat(ticks) : String);
    ticks = Math.round(0.66 * this.width / (50 * 5)) * 5;
    var domain_group = this.measure.select(".domain")
        .attr("transform", "translate(0," + (0.66 * this.height + 16) + ")");
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
};