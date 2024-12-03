import React, {useCallback, useEffect, useRef, useState} from "react";
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
  DestinationSerializerDetails, TypeC11Enum,
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
  const [rankdir, setRankdir] = useState<"TB" | "LR">("TB");
  const layoutNodes = useCallback((nodes: CustomNodeModel[], links: DefaultLinkModel[]) => {
    const g = new dagre.graphlib.Graph();
    
    g.setGraph({
      rankdir: rankdir,
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
      node => node.getOptions().anatomicalType === DestinationTypeMapping[TypeC11Enum.AfferentT]
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
  }, [rankdir]);
  
  const toggleRankdir = () => {
    setRankdir((prev) => (prev === "TB" ? "LR" : "TB"));
  };
  
  const initializeGraph = useCallback(() => {
    const model = new DiagramModel();
    
    // Process data to revert to the initial layout
    const { nodes, links } = processData({
      origins: origins ? origins : [],
      vias: vias ? vias : [],
      destinations,
      forwardConnection,
      serializedGraph,
    });
    
    // If the backend does NOT provides us a serialised graph then we use the smart routing.
    if (serializedGraph === undefined) {
      layoutNodes(nodes, links);
    }
    
    model.addAll(...nodes, ...links);
    engine.setModel(model);
    setModelUpdated(true);
    setModelFitted(false);
  }, [engine, serializedGraph, origins, vias, destinations, forwardConnection, layoutNodes]);
  
  const resetGraph = () => {
    initializeGraph()
    setRankdir('TB')
  };
  
  // This effect runs once to set up the engine
  useEffect(() => {
    engine.getNodeFactories().registerFactory(new CustomNodeFactory());
  }, [engine]);


  // This effect runs whenever origins, vias, or destinations change
  useEffect(() => {
    initializeGraph();
  }, [initializeGraph]);
  
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
          <NavigationMenu engine={engine} statementId={statementId || "-1"} rankdir={rankdir} toggleRankdir={toggleRankdir} resetGraph={resetGraph} />
          <InfoMenu engine={engine} forwardConnection={true}/>
          <CanvasWidget className={"graphContainer"} engine={engine}/>
        </div>)
      : null
  );
}

export default GraphDiagram;
