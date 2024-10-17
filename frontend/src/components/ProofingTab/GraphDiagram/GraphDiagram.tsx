import React, {useEffect, useLayoutEffect, useRef, useState} from "react";
import InfoMenu from "./InfoMenu";
import NavigationMenu from "./NavigationMenu";
import createEngine, {
    BasePositionModelOptions, DagreEngine,
    DiagramModel, PathFindingLinkFactory, DiagramEngine } from '@projectstorm/react-diagrams';
import {CanvasWidget} from '@projectstorm/react-canvas-core';
import {CustomNodeFactory} from "./Factories/CustomNodeFactory";
import {
  AnatomicalEntity,
  DestinationSerializerDetails,
  ViaSerializerDetails
} from "../../../apiclient/backend";
import {useParams} from "react-router-dom";
import { processData } from "../../../services/GraphDiagramService";


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


function genDagreEngine() {
    return new DagreEngine({
        graph: {
            rankdir: 'TB',
            ranksep: 300,
            nodesep: 250,
            marginx: 50,
            marginy: 50
        },
    });
}
function reroute(engine: DiagramEngine) {
    engine.getLinkFactories().getFactory<PathFindingLinkFactory>(PathFindingLinkFactory.NAME).calculateRoutingMatrix();
}
function autoDistribute(engine: DiagramEngine) {
    const model = engine.getModel();
    
    if (!model || model.getNodes().length === 0) {
        return;
    }
    
    const dagreEngine = genDagreEngine();
    dagreEngine.redistribute(model);
    
    reroute(engine);
    engine.repaintCanvas();
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
    
    useLayoutEffect(() => {
        autoDistribute(engine);
    }, [engine, modelUpdated]);
    
    useEffect(() => {
        const currentContainer = containerRef.current;
        
        if (modelUpdated && currentContainer) {
            autoDistribute(engine);
        }
    }, [engine, destinations, vias, origins]);
    
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
