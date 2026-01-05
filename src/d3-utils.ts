import * as d3 from "d3";

export function createTooltip() {
  return d3
    .select("body")
    .append("div")
    .attr("class", "chart-tooltip")
    .style("position", "absolute")
    .style("background", "#1a1b1e")
    .style("border", "1px solid #373a40")
    .style("border-radius", "4px")
    .style("padding", "8px")
    .style("font-size", "12px")
    .style("color", "#c1c2c5")
    .style("pointer-events", "none")
    .style("opacity", 0);
}
