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
  svg.selectAll("path")
    .data(nodes)
    .enter()
    .append("path")
    .attr("d", arc)
    .style("fill", d => color((d.children ? d : d.parent).data.id))
    .style("stroke", "white");
});