const width = 954;
const height = 954;

const format = d3.format(",d");

const color = d3.scaleOrdinal(d3.schemeCategory10);

const treemap = d3.treemap()
    .tile(d3.treemapSquarify)
    .size([width, height])
    .padding(1)
    .round(true);

const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("font", "10px sans-serif");

// Create a tooltip
const tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

d3.csv("data.csv").then(function(data) {
    const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.parent)
        (data)
        .sum(d => +d.value)
        .sort((a, b) => b.value - a.value);

    treemap(root);

    const cell = svg.selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("transform", d => `translate(${d.x0},${d.y0})`);

    cell.append("rect")
        .attr("width", d => d.x1 - d.x0)
        .attr("height", d => d.y1 - d.y0)
        .attr("fill", d => color(d.parent.data.id))
        .on("mouseover", function(event, d) {
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);
            tooltip.html(d.data.tooltip)
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        })
        .on("click", clicked);

    cell.append("text")
        .selectAll("tspan")
        .data(d => d.data.label.split(/(?=[A-Z][a-z])|\s+/g))
        .join("tspan")
        .attr("x", 3)
        .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`)
        .attr("fill-opacity", (d, i, nodes) => i === nodes.length - 1 ? 0.7 : null)
        .text(d => d);

    function clicked(event, d) {
        const [x0, y0, x1, y1] = [d.x0, d.y0, d.x1, d.y1];
        svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity
                .translate(width / 2, height / 2)
                .scale(Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height)))
                .translate(-(x0 + x1) / 2, -(y0 + y1) / 2)
        );
    }

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        const {transform} = event;
        cell.attr("transform", d => `translate(${transform.apply([d.x0, d.y0])})`);
        cell.select("rect")
            .attr("width", d => Math.max(0, transform.applyX(d.x1) - transform.applyX(d.x0)))
            .attr("height", d => Math.max(0, transform.applyY(d.y1) - transform.applyY(d.y0)));
    }
});