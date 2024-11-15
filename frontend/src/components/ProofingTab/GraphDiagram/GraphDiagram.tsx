import React, {useEffect, useRef, useState} from "react";
import InfoMenu from "./InfoMenu";
import NavigationMenu from "./NavigationMenu";
import createEngine, {
  BasePositionModelOptions,
  DiagramModel, DefaultLinkModel
} from '@projectstorm/react-diagrams';
import {CanvasWidget} from '@projectstorm/react-canvas-core';
import {CustomNodeFactory} from "./Factories/CustomNodeFactory";
import {
  AnatomicalEntity,
  DestinationSerializerDetails,
  ViaSerializerDetails
} from "../../../apiclient/backend";
import {useParams} from "react-router-dom";
import {DestinationTypeMapping, processData} from "../../../services/GraphDiagramService";

import dagre from 'dagre';
import {CustomNodeModel} from "./Models/CustomNodeModel";

export enum NodeTypes {
  Origin = 'Origin',
  Via = 'Via',
  Destination = 'Destination'
}

export interface CustomNodeOptions extends BasePositionModelOptions {
  forward_connection: any[];
  to?: Array<{ name: string; type: string }>;
  from?: Array<{ name: string; type: string }>;
  anatomicalType?: string;
}


interface GraphDiagramProps {
  origins: AnatomicalEntity[] | undefined;
  vias: ViaSerializerDetails[] | undefined;
  destinations: DestinationSerializerDetails[] | undefined;
  forwardConnection?: any[] | undefined;
  serializedGraph?: any | undefined
}

const GraphDiagram: React.FC<GraphDiagramProps> = ({
                                                     origins,
                                                     vias,
                                                     destinations,
                                                     forwardConnection = [],
                                                     serializedGraph,
                                                   }) => {
  const {statementId} = useParams();
  const [engine] = useState(() => createEngine());
  const [modelUpdated, setModelUpdated] = useState(false)
  const [modelFitted, setModelFitted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null);

  const layoutNodes = (nodes: CustomNodeModel[], links: DefaultLinkModel[]) => {
    const g = new dagre.graphlib.Graph();
    
    g.setGraph({
      rankdir: 'TB', // Top-to-bottom layout
      ranksep: 350,
      marginx: 150,
      marginy: 100,
      edgesep: 10,
    });
    
    g.setDefaultEdgeLabel(() => ({}));
    
    nodes.forEach(node => {
      g.setNode(node.getID(), { width: 100, height: 50 });
    });
    
    links.forEach(link => {
      g.setEdge(link.getSourcePort().getNode().getID(), link.getTargetPort().getNode().getID());
    });
    
    dagre.layout(g);
    
    const originNodes = nodes.filter(node => node.getCustomType() === NodeTypes.Origin);
    const maxOriginX = Math.max(...originNodes.map(node => g.node(node.getID()).x || 0));
    const minOriginY = Math.min(...originNodes.map(node => g.node(node.getID()).y || 0));

    const afferentTNodes = nodes.filter(
      node => node.getOptions().anatomicalType === DestinationTypeMapping["AFFERENT-T"]
    );

    afferentTNodes.forEach(afferentNode => {
      const { x } = g.node(afferentNode.getID());
      afferentNode.setPosition(maxOriginX + x, minOriginY);
    });
    
    g.nodes().forEach((nodeId: string) => {
      const node = nodes.find(n => n.getID() === nodeId);
      if (node && !afferentTNodes.includes(node)) {
        const { x, y } = g.node(nodeId);
        node.setPosition(x, y);
      }
    });
  };
  
  
  // This effect runs once to set up the engine
  useEffect(() => {
    engine.getNodeFactories().registerFactory(new CustomNodeFactory());
  }, [engine]);


  // This effect runs whenever origins, vias, or destinations change
  useEffect(() => {
    const model = new DiagramModel();

    // Process data using the refactored function
    const { nodes, links } = processData({
      origins,
      vias,
      destinations,
      forwardConnection,
      serializedGraph
    });
    
    layoutNodes(nodes, links);

    model.addAll(...nodes, ...links);
    engine.setModel(model);
    setModelUpdated(true);
  }, [engine, serializedGraph, origins, vias, destinations, forwardConnection]);

  // This effect prevents the default scroll and touchmove behavior
  useEffect(() => {
    const currentContainer = containerRef.current;

    if (modelUpdated && currentContainer) {
      const disableScroll = (event: Event) => {
        event.stopPropagation();
      };

      currentContainer.addEventListener('wheel', disableScroll, {passive: false});
      currentContainer.addEventListener('touchmove', disableScroll, {passive: false});

      return () => {
        currentContainer?.removeEventListener('wheel', disableScroll);
        currentContainer?.removeEventListener('touchmove', disableScroll);
      };
    }
  }, [modelUpdated]);

  useEffect(() => {
    if (modelUpdated && !modelFitted) {
      // TODO: for unknown reason at the moment if I call zoomToFit too early breaks the graph
      // To fix later in the next contract.
      setTimeout(() => {
        engine.zoomToFit();
      }, 1000);
      setModelFitted(true);
    }
  }, [modelUpdated, modelFitted, engine]);

  
    return (
    modelUpdated ? (
        <div ref={containerRef} className={"graphContainer"}>
          <NavigationMenu engine={engine} statementId={statementId || "-1"}/>
          <InfoMenu engine={engine} forwardConnection={true}/>
          <CanvasWidget className={"graphContainer"} engine={engine}/>
        </div>)
      : null
  );
}

export default GraphDiagram;
