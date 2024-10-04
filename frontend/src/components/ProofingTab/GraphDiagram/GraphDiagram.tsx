import React, {useEffect, useRef, useState} from "react";
import InfoMenu from "./InfoMenu";
import NavigationMenu from "./NavigationMenu";
import createEngine, {
  BasePositionModelOptions,
  DefaultLinkModel,
  DiagramModel,
} from '@projectstorm/react-diagrams';
import {CanvasWidget} from '@projectstorm/react-canvas-core';
import {CustomNodeModel} from "./Models/CustomNodeModel";
import {CustomNodeFactory} from "./Factories/CustomNodeFactory";
import {
  AnatomicalEntity,
  DestinationSerializerDetails,
  TypeB60Enum,
  TypeC11Enum,
  ViaSerializerDetails
} from "../../../apiclient/backend";
import {useParams} from "react-router-dom";


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

const ViaTypeMapping: Record<TypeB60Enum, string> = {
  [TypeB60Enum.Axon]: 'Axon',
  [TypeB60Enum.Dendrite]: 'Dendrite'
};

const DestinationTypeMapping: Record<TypeC11Enum, string> = {
  [TypeC11Enum.AxonT]: 'Axon terminal',
  [TypeC11Enum.AfferentT]: 'Afferent terminal',
  [TypeC11Enum.Unknown]: 'Not specified'
};

interface GraphDiagramProps {
  origins: AnatomicalEntity[] | undefined;
  vias: ViaSerializerDetails[] | undefined;
  destinations: DestinationSerializerDetails[] | undefined;
  forwardConnection?: any[] | undefined;
  graphState?: any | undefined
}

function getId(layerId: string, entity: AnatomicalEntity) {
  return layerId + entity.id.toString();
}

function findNodeForEntity(entity: AnatomicalEntity, nodeMap: Map<string, CustomNodeModel>, maxLayerIndex: number) {
  for (let layerIndex = 0; layerIndex <= maxLayerIndex; layerIndex++) {
    const layerId = layerIndex === 0 ? NodeTypes.Origin : NodeTypes.Via + layerIndex
    const id = getId(layerId, entity);
    if (nodeMap.has(id)) {
      return nodeMap.get(id);
    }
  }
  return null;
}

const createLink = (sourceNode: CustomNodeModel, targetNode: CustomNodeModel, sourcePortName: string, targetPortName: string) => {
  const sourcePort = sourceNode.getPort(sourcePortName);
  const targetPort = targetNode.getPort(targetPortName);
  if (sourcePort && targetPort) {
    const link = new DefaultLinkModel();
    link.setSourcePort(sourcePort);
    link.setTargetPort(targetPort);
    link.getOptions().curvyness = 0
    return link;
  }
  return null;
};

// TODO: Consider graph state information
const processData = (
  origins: AnatomicalEntity[] | undefined,
  vias: ViaSerializerDetails[] | undefined,
  destinations: DestinationSerializerDetails[] | undefined,
  forward_connection: any[],
): { nodes: CustomNodeModel[], links: DefaultLinkModel[] } => {
  const nodes: CustomNodeModel[] = [];
  const links: DefaultLinkModel[] = [];

  const nodeMap = new Map<string, CustomNodeModel>();

  const yStart = 50
  const yIncrement = 250; // Vertical spacing
  const xIncrement = 250; // Horizontal spacing
  let xOrigin = 100

  origins?.forEach(origin => {
    const id = getId(NodeTypes.Origin, origin)
    const name = origin.simple_entity !== null ? origin.simple_entity.name : origin.region_layer.region.name + '(' + origin.region_layer.layer.name + ')';
    const ontology_uri = origin.simple_entity !== null ? origin.simple_entity.ontology_uri : origin.region_layer.region.ontology_uri + ', ' + origin.region_layer.layer.ontology_uri;
    const fws: never[] = []
    const originNode = new CustomNodeModel(
      NodeTypes.Origin,
      name,
      ontology_uri,
      {
        forward_connection: fws,
        to: [],
      }
    );
    originNode.setPosition(xOrigin, yStart);
    nodes.push(originNode);
    nodeMap.set(id, originNode);
    xOrigin += xIncrement;
  });


  vias?.forEach((via) => {
    const layerIndex = via.order + 1
    let xVia = 120
    let yVia = layerIndex * yIncrement + yStart;
    via.anatomical_entities.forEach(entity => {
      const id = getId(NodeTypes.Via + layerIndex, entity)
      const name = entity.simple_entity !== null ? entity.simple_entity.name : entity.region_layer.region.name + '(' + entity.region_layer.layer.name + ')';
      const ontology_uri = entity.simple_entity !== null ? entity.simple_entity.ontology_uri : entity.region_layer.region.ontology_uri + ', ' + entity.region_layer.layer.ontology_uri;
      const fws: never[] = []
      const viaNode = new CustomNodeModel(
        NodeTypes.Via,
        name,
        ontology_uri,
        {
          forward_connection: fws,
          from: [],
          to: [],
          anatomicalType: via?.type ? ViaTypeMapping[via.type] : ''
        }
      );
      viaNode.setPosition(xVia, yVia);
      nodes.push(viaNode);
      nodeMap.set(id, viaNode);
      xVia += xIncrement

      via.from_entities.forEach(fromEntity => {
        const sourceNode = findNodeForEntity(fromEntity, nodeMap, layerIndex - 1);
        if (sourceNode) {
          const link = createLink(sourceNode, viaNode, 'out', 'in');
          if (link) {
            links.push(link);
            const sourceOptions = sourceNode.getOptions() as CustomNodeOptions;
            const viaOptions = viaNode.getOptions() as CustomNodeOptions;
            sourceOptions.to?.push({name: viaNode.name, type: NodeTypes.Via});
            viaOptions.from?.push({name: sourceNode.name, type: sourceNode.getCustomType()})
          }
        }
      });
    });
    yVia += yIncrement;
  });


  const yDestination = yIncrement * ((vias?.length || 1) + 1) + yStart
  let xDestination = 115


  // Process Destinations
  destinations?.forEach(destination => {
    destination.anatomical_entities.forEach(entity => {
      const name = entity.simple_entity !== null ? entity.simple_entity.name : entity.region_layer.region.name + '(' + entity.region_layer.layer.name + ')';
      const ontology_uri = entity.simple_entity !== null ? entity.simple_entity.ontology_uri : entity.region_layer.region.ontology_uri + ', ' + entity.region_layer.layer.ontology_uri;
      const fws = forward_connection.filter(single_fw => {
        const origins = single_fw.origins.map((origin: {
          id: string
        } | string) => typeof origin === 'object' ? origin.id : origin);
        if (origins.includes(entity.id)) {
          return true;
        }
        return false;
      });
      const destinationNode = new CustomNodeModel(
        NodeTypes.Destination,
        name,
        ontology_uri,
        {
          forward_connection: fws,
          from: [],
          anatomicalType: destination?.type ? DestinationTypeMapping[destination.type] : '',
        }
      );
      destinationNode.setPosition(xDestination, yDestination);
      nodes.push(destinationNode);
      xDestination += xIncrement;
      xDestination += xIncrement;
      destination.from_entities.forEach(fromEntity => {
        const sourceNode = findNodeForEntity(fromEntity, nodeMap, vias?.length || 0);
        if (sourceNode) {
          const link = createLink(sourceNode, destinationNode, 'out', 'in');
          if (link) {
            links.push(link);
            const sourceOptions = sourceNode.getOptions() as CustomNodeOptions;
            const destinationOptions = destinationNode.getOptions() as CustomNodeOptions;
            sourceOptions.to?.push({name: destinationNode.name, type: NodeTypes.Destination});
            destinationOptions.from?.push({name: sourceNode.name, type: sourceNode.getCustomType()})
          }
        }
      });
    });
  });

  return {nodes, links};
};

const GraphDiagram: React.FC<GraphDiagramProps> = ({
                                                     origins,
                                                     vias,
                                                     destinations,
                                                     forwardConnection = [],
                                                     graphState
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
    if (graphState) {
      // If graphState is provided, deserialize it and set it as the model
      try {
        model.deserializeModel(graphState, engine);
        setModelUpdated(true);
      } catch (error) {
        // Fallback to processing data if deserialization fails
        const {nodes, links} = processData(origins, vias, destinations, forwardConnection);
        model.addAll(...nodes, ...links);
        setModelUpdated(true);
      }
    } else {
      // If no graphState, process data to create nodes and links
      const {nodes, links} = processData(origins, vias, destinations, forwardConnection);
      model.addAll(...nodes, ...links);
      setModelUpdated(true);
    }

    engine.setModel(model);
    // engine.getModel().setLocked(true)
    setModelUpdated(true)
  }, [origins, vias, destinations, engine, forwardConnection, graphState]);

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
