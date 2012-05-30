var IGraphs = IGraphs || {}; // namespace for Insight Graphs

/*
 * Initialize global IGraphs variables here
 */
IGraphs.init = function() {
    IGraphs.container = d3.select("#graphs");
};

/*
 * Base Graph object
 */
IGraphs.Graph = function(title) {
    this.title = title;
    this.layout = undefined; // defined in children
    
};

IGraphs.Graph.prototype = {
    constructor: IGraphs.Graph,
    draw: function(element) {
        // override in children
    },
    updateData: function() {
        // override in children
    },
    selectTableData: function(table_id, column_indices, column_names) {
        var data = [];
        var rows = d3.selectAll("#" + table_id + " tbody tr");
        for (var i = 0; i < rows[0].length; i++) {
            var row = d3.select(rows[0][i]).selectAll("td, th");
            var r = {}
            for (var j = 0; j < column_indices.length; j++)
                r[column_names[j]] = row[0][column_indices[j]].innerText;
            data.push(r);
        }
        return data;
    },
};

/*
 * PieChart object
 */
IGraphs.PieChart = function(title, width, height, radius) {
    IGraphs.Graph.call(this, title);
    this.layout = d3.layout.pie();
    this.colour = d3.scale.category20();
    this.chart = IGraphs.container.append("svg:svg")
        .attr("class", "graph")
        .attr("width", width)
        .attr("height", height);
    this.arcs = this.chart.append("svg:g")
        .attr("class", "arc")
        .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
    this.labels = this.chart.append("svg:g")
        .attr("class", "labels")
        .attr("transform", "translate(" + (width/2) + "," + (height/2) + ")");
    this.arc = d3.svg.arc()
        .startAngle(function(d){ return d.startAngle; })
        .endAngle(function(d){ return d.endAngle; })
        .innerRadius(0)
        .outerRadius(radius);
};

IGraphs.PieChart.prototype = new IGraphs.Graph();
IGraphs.PieChart.prototype.constructor = IGraphs.PieChart;
IGraphs.PieChart.prototype.supr = IGraphs.Graph.prototype;

IGraphs.PieChart.prototype.updateData = function(table_id, key_column_index, value_column_index) {
    this.data = this.supr.selectTableData.call(
        this,
        table_id, 
        [key_column_index, value_column_index], 
        ['key', 'value']
    );
    return this.data;
};

IGraphs.PieChart.prototype.pieHelper = d3.layout.pie().value(function(d) {return d.value;});

IGraphs.PieChart.prototype.draw = function(element) {
    var total = 0;
    var pieData = this.pieHelper(this.data);
    function filterData(element, index, array) {
        element.name = this.data[index].key;
        element.value = this.data[index].value;
        total += element.value;
        return (element.value > 0);
    }
    //console.log(pie);
    //var data = pie.filter(filterData);
    
    if (pieData.length > 0) {
        var getColour = d3.scale.category20();
        var arcs = this.arcs.selectAll("path").data(pieData);
        arcs.enter().append("svg:path")
            .attr("stroke", "white")
            .attr("stroke-width", 0.5)
            .attr("fill", function(d, i) { return getColour(i); })
            .attr("d", this.arc);
        arcs.exit().remove();
    }
};