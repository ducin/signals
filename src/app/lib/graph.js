import '../../styles.css';
import * as d3 from 'd3';

const visualConfig = {
  area: {
    width: 500,
    height: 500,
  },
  node: {
    radius: 20,
    distance: 125,
    borderDirty: 'red',
  },
  signal: {
    color: {
      SIGNAL: '#FF85BE',
      COMPUTED: '#85CEFF',
      EFFECT: '#BFA6DD',
      // SIGNAL: '#D4D4ED',
      // COMPUTED: '#B7B7E1',
      // EFFECT: '#9A9AD5',
    },
  },
  edge: {
    scale: 2,
    color: '#000',
  },
};

export function initializeGraph(broker) {
  // set up initial nodes and links
  //  - nodes are known by 'id', not by index in array.
  //  - links are always source < target; edge directions are set by 'left' and 'right'.
  const nodes = [];
  const links = [];

  const nodeDataCache = {};

  function nodeLabel(node) {
    const hasValue = ['SIGNAL', 'COMPUTED'].includes(node.type);
    return hasValue ? `${node.ID} (${node.innerValue})` : node.ID;
  }

  const isDefined = (value) => value !== undefined;

  function tooltipMarkup(d) {
    const type = nodeDataCache[d.id].type;
    const labels = [`<div><strong>type</strong>: ${type}</div>`];
    const innerValue = nodeDataCache[d.id]?.innerValue;
    if (isDefined(innerValue)) {
      labels.push(`<div><strong>value</strong>: ${innerValue}</div>`);
    }
    const dirty = nodeDataCache[d.id]?.dirty;
    if (isDefined(dirty)) {
      labels.push(`<div><strong>dirty</strong>: ${dirty}</div>`);
    }
    return labels.join('');
  }

  function getBaseColor(d) {
    return visualConfig.signal.color[d.type];
  }

  function getColor(d, selected = false) {
    const baseColor = getBaseColor(d);
    return selected ? d3.rgb(baseColor).brighter().toString() : baseColor;
  }

  function circleStrokeColor(d) {
    const isDirty = nodeDataCache[d.id]?.dirty;
    return isDirty == true
      ? visualConfig.node.borderDirty
      : d3.rgb(getBaseColor(d)).darker().toString();
  }

  function initZoom() {
    d3.select('svg').call(zoom);
  }

  function handleZoom(e) {
    d3.selectAll('svg g').attr('transform', e.transform);
  }

  let zoom = d3.zoom().on('zoom', handleZoom);

  const svg = d3
    .select('#graph')
    .append('svg')
    .on('contextmenu', (event) => {
      event.preventDefault();
    })
    .attr('width', visualConfig.area.width)
    .attr('height', visualConfig.area.height);

  // init D3 force layout
  const force = d3
    .forceSimulation()
    .force(
      'link',
      d3
        .forceLink()
        .id((d) => d.id)
        .distance(visualConfig.node.distance)
    )
    .force('charge', d3.forceManyBody().strength(-500))
    .force('x', d3.forceX(visualConfig.area.width / 2))
    .force('y', d3.forceY(visualConfig.area.height / 2))
    // .force('center', d3.forceCenter())
    .on('tick', tick);

  // // init D3 drag support
  // const drag = d3
  //   .drag()
  //   // Mac Firefox doesn't distinguish between left/right click when Ctrl is held...
  //   .filter(() => event.button === 0 || event.button === 2)
  //   .on('start', (event, d) => {
  //     if (!event.active) force.alphaTarget(0.3).restart();

  //     d.fx = d.x;
  //     d.fy = d.y;
  //   })
  //   .on('drag', (event, d) => {
  //     d.fx = event.x;
  //     d.fy = event.y;
  //   })
  //   .on('end', (event, d) => {
  //     if (!event.active) force.alphaTarget(0);

  //     d.fx = null;
  //     d.fy = null;
  //   });

  function drag(simulation) {
    function dragstarted(event) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return d3
      .drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
  }

  const scale = visualConfig.edge.scale;

  // define arrow markers for graph links
  svg
    .append('svg:defs')
    .append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', `0 -${scale * 5} ${scale * 10} ${scale * 10}`)
    .attr('refX', scale * 11)
    .attr('markerWidth', scale * 3)
    .attr('markerHeight', scale * 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', `M0,-${scale * 5}L${scale * 10},0L0,${scale * 5}`)
    .attr('fill', visualConfig.edge.color);

  svg
    .append('svg:defs')
    .append('svg:marker')
    .attr('id', 'start-arrow')
    .attr('viewBox', `0 -${scale * 5} ${scale * 10} ${scale * 10}`)
    .attr('refX', -scale)
    .attr('markerWidth', scale * 3)
    .attr('markerHeight', scale * 3)
    .attr('orient', 'auto')
    .append('svg:path')
    .attr('d', `M${scale * 10},-${scale * 5}L0,0L${scale * 10},${scale * 5}`)
    .attr('fill', visualConfig.edge.color);

  var tooltip = d3
    .select('body')
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .text('');

  // handles to link and node element groups
  let path = svg.append('svg:g').selectAll('path');
  let circle = svg.append('svg:g').selectAll('g');
  circle.call(drag(force));

  // update force layout (called automatically each iteration)
  function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', (d) => {
      const deltaX = d.target.x - d.source.x;
      const deltaY = d.target.y - d.source.y;
      const dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const normX = deltaX / dist;
      const normY = deltaY / dist;
      const sourcePadding = d.left ? 17 : 12;
      const targetPadding = d.right ? 17 : 12;
      const sourceX = d.source.x + sourcePadding * normX;
      const sourceY = d.source.y + sourcePadding * normY;
      const targetX = d.target.x - targetPadding * normX;
      const targetY = d.target.y - targetPadding * normY;

      return `M${sourceX},${sourceY}L${targetX},${targetY}`;
    });

    circle.attr('transform', (d) => `translate(${d.x},${d.y})`);
  }

  // update graph (called when needed)
  function restart() {
    // path (link) group
    path = path.data(links);

    // update existing links
    path
      .style('marker-start', (d) => (d.left ? 'url(#start-arrow)' : ''))
      .style('marker-end', (d) => (d.right ? 'url(#end-arrow)' : ''));

    // remove old links
    path.exit().remove();

    // add new links
    path = path
      .enter()
      .append('svg:path')
      .attr('class', 'link')
      .attr('stroke', visualConfig.edge.color)
      .style('marker-start', (d) => (d.left ? 'url(#start-arrow)' : ''))
      .style('marker-end', (d) => (d.right ? 'url(#end-arrow)' : ''))
      .merge(path);

    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(nodes, (d) => d.id);

    // remove old nodes
    circle.exit().remove();
    // add new nodes
    const g = circle.enter().append('svg:g');

    g.append('svg:circle')
      .attr('class', 'node')
      .attr('r', visualConfig.node.radius)
      .attr('id', (d) => `circle-${d.id}`)
      .style('fill', (d) => getColor(d))
      .style('stroke', (d) => circleStrokeColor(d))
      .style('stroke-width', '2px')
      .on('mouseover', function (event, d) {
        d3.select(event.target).attr('transform', 'scale(1.2)');
        tooltip
          .style('visibility', 'visible')
          .style('left', event.pageX - 25 + 'px')
          .style('top', event.pageY + 15 + 'px')
          .html(tooltipMarkup(d));
      })
      .on('mouseout', function (event, d) {
        d3.select(event.target).attr('transform', '');
        tooltip.style('visibility', 'hidden');
      })
      .on('mousemove', (event, d) => {
        tooltip
          .style('left', event.pageX - 25 + 'px')
          .style('top', event.pageY + 15 + 'px');
      })
      .on('mousedown', (event, d) => {
        tooltip.style('visibility', 'hidden');
        // TODO: this info shouldn't be here!
        const signalId = d.id;
        const signalNode = nodeDataCache[signalId];
        if (['SIGNAL', 'COMPUTED'].includes(signalNode.type)) {
          const getValue = signalNode.getValue;
          broker.publish('new-effect', { target: signalId, getValue });
        } else {
          const destroy = signalNode.destroy;
          broker.publish('destroy-effect', { target: signalId, destroy });

          detachNodeWithLinks(signalId);
        }
      });
    // .on('mouseup', function (event, d) {
    // });

    // show node IDs
    g.append('svg:text')
      .attr('x', 0)
      .attr('y', 4)
      .attr('class', 'id')
      .attr('id', (d) => `label-${d.id}`)
      .text((d) => nodeLabel(nodeDataCache[d.id]))
      .attr('fill', visualConfig.edge.color);

    circle = g.merge(circle);

    // set the graph in motion
    force.nodes(nodes).force('link').links(links);

    force.alphaTarget(0.3).restart();
  }

  function detachNodeWithLinks(signalId) {
    for (const [idx, link] of links.entries()) {
      if (link.target.id == signalId || link.source.id == signalId) {
        links.splice(idx, 1);
      }
    }
    for (const [idx, node] of nodes.entries()) {
      if (node.id == signalId) {
        nodes.splice(idx, 1);
      }
    }
    restart();
  }

  broker.subscribe('node-add', (node) => {
    const graphNode = {
      id: node.ID,
      type: node.type,
    };
    nodes.push(graphNode);
    nodeDataCache[node.ID] = node;
    restart();
  });

  broker.subscribe('node-data', ({ node }) => {
    d3.select(`#label-${node.ID}`).text(nodeLabel(node));
    d3.select(`#circle-${node.ID}`).style('stroke', (d) =>
      circleStrokeColor(d)
    );
    nodeDataCache[node.ID] = node;
  });

  broker.subscribe('link-add', ({ consumer, provider }) => {
    links.push({
      source: provider.ID,
      target: consumer.ID,
      left: false,
      right: true,
    });
    restart();
  });

  restart();
  initZoom();
}
