// Set up dimensions
const width = 932;
const height = width;
const radius = width / 6;

// Create the SVG container
const svg = d3.select("#chart")
  .append("svg")
  .attr("viewBox", [0, 0, width, width])
  .style("font", "10px sans-serif");

// Create a group for the chart
const g = svg.append("g")
  .attr("transform", `translate(${width / 2},${width / 2})`);

// Create a tooltip
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Load and process the data
d3.csv("data.csv").then(data => {
  const root = partition(data);
  
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1));

  const color = d3.scaleOrdinal(d3.quantize(d3.interpolateRainbow, data.length + 1));

  g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .join("path")
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.id); })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => arc(d.current))
      .on("mouseover", (event, d) => {
        tooltip.transition()
          .duration(200)
          .style("opacity", .9);
        tooltip.html(d.data.tooltip)
          .style("left", (event.pageX) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
      });

  g.append("g")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .attr("font-size", 10)
    .attr("fill-opacity", 0.6)
    .selectAll("text")
    .data(root.descendants().slice(1))
    .join("text")
      .attr("transform", d => labelTransform(d.current))
      .attr("dy", "0.35em")
      .text(d => d.data.label)
      .attr("fill-opacity", d => +labelVisible(d.current));

  g.append("circle")
    .datum(root)
    .attr("r", radius)
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("click", clicked);

  function clicked(event, p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(750);

    path.transition(t)
      .tween("data", d => {
        const i = d3.interpolate(d.current, d.target);
        return t => d.current = i(t);
      })
      .filter(function(d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
      .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
      .attrTween("d", d => () => arc(d.current));

    label.filter(function(d) {
      return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    }).transition(t)
      .attr("fill-opacity", d => +labelVisible(d.target))
      .attrTween("transform", d => () => labelTransform(d.current));
  }
  
  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  function partition(data) {
    const root = d3.stratify()
      .id(d => d.id)
      .parentId(d => d.parent)
      (data)
      .sum(d => d.value)
      .sort((a, b) => b.value - a.value);
    return d3.partition()
      .size([2 * Math.PI, root.height + 1])
      (root);
  }
});