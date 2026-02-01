import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { createTooltip } from "../d3-utils.ts";
import { useChartTheme, type ChartColors } from "../context/ThemeContext.tsx";
import { chartMargins } from "../theme.ts";

export interface ChartMargin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  innerWidth: number;
  innerHeight: number;
  margin: ChartMargin;
}

export interface D3ChartContext {
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  g: d3.Selection<SVGGElement, unknown, null, undefined>;
  tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, undefined>;
  dimensions: ChartDimensions;
  colors: ChartColors;
}

type RenderFn = (ctx: D3ChartContext) => void;

export function useD3Chart(
  renderFn: RenderFn,
  deps: React.DependencyList,
  width: number,
  height: number,
  margin: ChartMargin = chartMargins,
): React.RefObject<SVGSVGElement | null> {
  const svgRef = useRef<SVGSVGElement>(null);
  const { colors } = useChartTheme();

  // Include colors in deps so charts re-render on theme change
  const allDeps = [...deps, colors];

  // Deps are managed by the caller (similar to useMemo/useCallback pattern)
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps passed by caller
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = createTooltip(colors);

    const dimensions: ChartDimensions = {
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
    };

    renderFn({ svg, g, tooltip, dimensions, colors });

    return () => {
      tooltip.remove();
    };
  }, allDeps);

  return svgRef;
}
