import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export function BoxPlot({ q1, median, q3, label, color, maxCost }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (q1 == null || median == null || q3 == null) {
      if (containerRef.current) {
        containerRef.current.innerHTML = '<p class="text-xs text-gray-500 p-2">Range data not available.</p>';
      }
      return;
    }

    const formatter = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      maximumFractionDigits: 0
    });

    const width = 220;
    const height = 50;
    const margin = { top: 20, right: 10, bottom: 5, left: 40 };

    let adjustedQ1 = q1;
    let adjustedQ3 = q3;
    if (q1 > q3) {
      [adjustedQ1, adjustedQ3] = [q3, q1];
    }

    d3.select(containerRef.current).select('svg').remove();
    const svg = d3
      .select(containerRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain([0, maxCost]).range([0, width - margin.left - margin.right]);
    const center = (height - margin.top - margin.bottom) / 2;

    svg
      .append('line')
      .attr('x1', x(adjustedQ1))
      .attr('x2', x(adjustedQ3))
      .attr('y1', center)
      .attr('y2', center)
      .attr('stroke', color)
      .attr('stroke-width', 2);

    svg
      .append('rect')
      .attr('x', x(adjustedQ1))
      .attr('y', center - 6)
      .attr('width', x(adjustedQ3) - x(adjustedQ1))
      .attr('height', 12)
      .attr('stroke', color)
      .attr('fill', color)
      .attr('fill-opacity', 0.3);

    svg
      .append('line')
      .attr('x1', x(median))
      .attr('x2', x(median))
      .attr('y1', center - 8)
      .attr('y2', center + 8)
      .attr('stroke', color)
      .attr('stroke-width', 3);

    const addLabel = (val, y, weight = '600') => {
      svg
        .append('text')
        .attr('x', x(val))
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('font-weight', weight)
        .attr('fill', color)
        .text(formatter.format(val));
    };

    addLabel(adjustedQ1, -2);
    addLabel(adjustedQ3, -2);
    addLabel(median, -12, 'bold');

    svg
      .append('text')
      .attr('x', -margin.left + 5)
      .attr('y', center + 4)
      .attr('fill', '#1f2937')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .text(label);
  }, [q1, median, q3, label, color, maxCost]);

  return <div ref={containerRef} className="box-plot-area" />;
}

