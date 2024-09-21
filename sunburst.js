// SVGのサイズを設定
const width = 600;
const height = 600;
const radius = Math.min(width, height) / 2;

// SVG要素を作成
const svg = d3.select("#chart")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .append("g")
  .attr("transform", `translate(${width / 2},${height / 2})`);

// ツールチップを作成
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// CSVファイルを読み込む
d3.csv("data.csv").then(data => {
  // データを階層構造に変換
  const root = d3.stratify()
    .id(d => d.id)
    .parentId(d => d.parent)
    (data);
  
  root.sum(d => +d.value);

  // パーティションレイアウトを作成
  const partition = d3.partition()
    .size([2 * Math.PI, radius]);

  // データをパーティションレイアウトに適用
  const nodes = partition(root).descendants();

  // 色スケールを設定
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // アークジェネレーターを作成
  const arc = d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .innerRadius(d => d.y0)
    .outerRadius(d => d.y1);

  // Sunburst Chartを描画
  const paths = svg.selectAll("path")
    .data(nodes)
    .enter()
    .append("path")
    .attr("d", arc)
    .style("fill", d => color((d.children ? d : d.parent).data.id))
    .style("stroke", "white")
    .on("mouseover", (event, d) => {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(d.data.tooltip || `${d.data.label}: ${d.value}`)
        .style("left", (event.pageX) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", () => {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    })
    .on("click", clicked);

  // ラベルを追加
  const labels = svg.selectAll("text")
    .data(nodes.filter(d => (d.x1 - d.x0) > 0.1))
    .enter()
    .append("text")
    .attr("transform", d => `translate(${arc.centroid(d)})rotate(${(d.x0 + d.x1) / 2 * 180 / Math.PI - 90})`)
    .attr("dy", "0.35em")
    .text(d => d.data.label)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("fill", "white");

  // クリックによるズーム機能
  function clicked(event, p) {
    svg.transition().duration(750).tween("scale", () => {
      const xd = d3.interpolate(root.x0, p.x0);
      const yd = d3.interpolate(root.y0, p.y0);
      return t => {
        root.x0 = xd(t);
        root.y0 = yd(t);
        paths.attr("d", arc);
        labels.attr("transform", d => `translate(${arc.centroid(d)})rotate(${(d.x0 + d.x1) / 2 * 180 / Math.PI - 90})`);
      };
    });
  }
});