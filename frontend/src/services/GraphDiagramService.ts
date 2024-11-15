import {DefaultLinkModel} from "@projectstorm/react-diagrams";
import {
  AnatomicalEntity,
  ViaSerializerDetails,
  DestinationSerializerDetails,
  TypeC11Enum,
  TypeB60Enum
} from "../apiclient/backend";
import {CustomNodeModel} from "../components/ProofingTab/GraphDiagram/Models/CustomNodeModel";
import {CustomNodeOptions, NodeTypes} from "../components/ProofingTab/GraphDiagram/GraphDiagram";

const ViaTypeMapping: Record<TypeB60Enum, string> = {
  [TypeB60Enum.Axon]: 'Axon',
  [TypeB60Enum.Dendrite]: 'Dendrite'
};

export const DestinationTypeMapping: Record<TypeC11Enum, string> = {
  [TypeC11Enum.AxonT]: 'Axon terminal',
  [TypeC11Enum.AfferentT]: 'Afferent terminal',
  [TypeC11Enum.Unknown]: 'Not specified'
};

const POSITION_CONSTANTS = {
  yStart: 50,
  yIncrement: 250, // Vertical spacing
  xIncrement: 250, // Horizontal spacing
  xStart: 100
};

interface ProcessDataParams {
  origins: AnatomicalEntity[] | undefined;
  vias: ViaSerializerDetails[] | undefined;
  destinations: DestinationSerializerDetails[] | undefined;
  forwardConnection: any[];
  serializedGraph?: any;
}

export const processData = ({
                              origins,
                              vias,
                              destinations,
                              forwardConnection,
                              serializedGraph
                            }: ProcessDataParams): { nodes: CustomNodeModel[]; links: DefaultLinkModel[] } => {
  const nodes: CustomNodeModel[] = [];
  const links: DefaultLinkModel[] = [];
  const nodeMap = new Map<string, CustomNodeModel>();

  // Extract positions per node type
  const existingPositions = extractNodePositionsFromSerializedGraph(serializedGraph);

  // Process nodes with type-specific positions
  processOrigins(origins, nodeMap, nodes, existingPositions.get(NodeTypes.Origin) || new Map());
  processVias(vias, nodeMap, nodes, links, existingPositions.get(NodeTypes.Via) || new Map());
  processDestinations(
    destinations,
    forwardConnection,
    nodeMap,
    nodes,
    links,
    existingPositions.get(NodeTypes.Destination) || new Map(),
    vias?.length || 0
  );

  return {nodes, links};
};

// Helper functions

function extractNodePositionsFromSerializedGraph(serializedGraph: any): Map<string, Map<string, {
  x: number;
  y: number
}>> {
  const positions = new Map<string, Map<string, { x: number; y: number }>>();
  if (!serializedGraph) return positions;

  const layers = serializedGraph.layers || [];
  const nodesLayer = layers.find((layer: any) => layer.type === 'diagram-nodes');
  if (!nodesLayer || !nodesLayer.models) return positions;

  const models = nodesLayer.models;
  Object.values(models).forEach((model: any) => {
    const externalId = model.externalId;
    const customType = model.customType; // NodeTypes: 'Origin', 'Via', 'Destination'
    const position = model.position || {x: model.x, y: model.y};
    if (externalId && position && customType) {
      if (!positions.has(customType)) {
        positions.set(customType, new Map());
      }
      positions.get(customType)!.set(externalId, {x: position.x, y: position.y});
    }
  });
  return positions;
}

function processOrigins(
  origins: AnatomicalEntity[] | undefined,
  nodeMap: Map<string, CustomNodeModel>,
  nodes: CustomNodeModel[],
  existingPositions: Map<string, { x: number; y: number }>
) {
  const {yStart, xIncrement, xStart} = POSITION_CONSTANTS;
  let xOrigin = xStart;

  origins?.forEach(origin => {
    const id = getId(NodeTypes.Origin, origin);
    const {name} = getEntityNameAndUri(origin);
    const fws: never[] = [];
    const originNode = new CustomNodeModel(
      NodeTypes.Origin,
      name,
      origin.id.toString(),
      {
        forward_connection: fws,
        to: []
      }
    );

    setPosition(originNode, existingPositions, xOrigin, yStart, nodes);
    nodes.push(originNode);
    nodeMap.set(id, originNode);
    xOrigin += xIncrement;
  });
}

function processVias(
  vias: ViaSerializerDetails[] | undefined,
  nodeMap: Map<string, CustomNodeModel>,
  nodes: CustomNodeModel[],
  links: DefaultLinkModel[],
  existingPositions: Map<string, { x: number; y: number }>
) {
  const {yStart, yIncrement, xIncrement} = POSITION_CONSTANTS;

  vias?.forEach(via => {
    const layerIndex = via.order + 1;
    let xVia = 120;
    const yVia = layerIndex * yIncrement + yStart;

    via.anatomical_entities.forEach(entity => {
      const id = getId(NodeTypes.Via + layerIndex, entity);
      const {name} = getEntityNameAndUri(entity);
      const viaNode = new CustomNodeModel(
        NodeTypes.Via,
        name,
        entity.id.toString(),
        {
          forward_connection: [],
          from: [],
          to: [],
          anatomicalType: via?.type ? ViaTypeMapping[via.type] : ''
        }
      );

      setPosition(viaNode, existingPositions, xVia, yVia, nodes);
      nodes.push(viaNode);
      nodeMap.set(id, viaNode);
      xVia += xIncrement;

      via.from_entities.forEach(fromEntity => {
        const sourceNode = findNodeForEntity(fromEntity, nodeMap, layerIndex - 1);
        if (sourceNode) {
          const link = createLink(sourceNode, viaNode, 'out', 'in');
          if (link) {
            links.push(link);
            updateNodeOptions(sourceNode, viaNode, NodeTypes.Via);
          }
        }
      });
    });
  });
}

function processDestinations(
  destinations: DestinationSerializerDetails[] | undefined,
  forwardConnection: any[],
  nodeMap: Map<string, CustomNodeModel>,
  nodes: CustomNodeModel[],
  links: DefaultLinkModel[],
  existingPositions: Map<string, { x: number; y: number }>,
  viasLength: number
) {
  const {yStart, yIncrement, xIncrement} = POSITION_CONSTANTS;
  const yDestination = yIncrement * (viasLength + 1) + yStart;
  let xDestination = 115;

  destinations?.forEach(destination => {
    destination.anatomical_entities.forEach(entity => {
      const {name} = getEntityNameAndUri(entity);
      const fws = filterForwardConnections(forwardConnection, entity);
      const destinationNode = new CustomNodeModel(
        NodeTypes.Destination,
        name,
        entity.id.toString(),
        {
          forward_connection: fws,
          from: [],
          anatomicalType: destination?.type ? DestinationTypeMapping[destination.type] : ''
        }
      );

      setPosition(destinationNode, existingPositions, xDestination, yDestination, nodes);
      nodes.push(destinationNode);
      xDestination += xIncrement;

      destination.from_entities.forEach(fromEntity => {
        const sourceNode = findNodeForEntity(fromEntity, nodeMap, viasLength || 0);
        if (sourceNode) {
          const link = createLink(sourceNode, destinationNode, 'out', 'in');
          if (link) {
            links.push(link);
            updateNodeOptions(sourceNode, destinationNode, NodeTypes.Destination);
          }
        }
      });
    });
  });
}

// Utility functions

function getId(layerId: string, entity: AnatomicalEntity): string {
  return layerId + entity.id.toString();
}

function getEntityNameAndUri(entity: AnatomicalEntity): { name: string; ontology_uri: string } {
  const name = entity.simple_entity
    ? entity.simple_entity.name
    : `${entity.region_layer.region.name}(${entity.region_layer.layer.name})`;
  const ontology_uri = entity.simple_entity
    ? entity.simple_entity.ontology_uri
    : `${entity.region_layer.region.ontology_uri}, ${entity.region_layer.layer.ontology_uri}`;
  return {name, ontology_uri};
}

function setPosition(
  node: CustomNodeModel,
  existingPositions: Map<string, { x: number; y: number }>,
  defaultX: number,
  defaultY: number,
  nodes: CustomNodeModel[]
) {
  const externalId = node.externalId;
  if (existingPositions.has(externalId)) {
    const position = existingPositions.get(externalId)!;
    node.setPosition(position.x, position.y);
  } else {
    const {x, y} = findNonOverlappingPosition(defaultX, defaultY, nodes);
    node.setPosition(x, y);
  }
}

function findNonOverlappingPosition(
  x: number,
  y: number,
  nodes: CustomNodeModel[]
): { x: number; y: number } {
  let newX = x;
  let newY = y;
  let collision = false;
  do {
    let currentX = newX;
    let currentY = newY;

    collision = nodes.some(node => {
      return Math.abs(node.getX() - currentX) < 50 && Math.abs(node.getY() - currentY) < 50;
    });

    if (collision) {
      newX += 50;
      newY += 50;
    }
  } while (collision);

  return {x: newX, y: newY};
}

function findNodeForEntity(
  entity: AnatomicalEntity,
  nodeMap: Map<string, CustomNodeModel>,
  maxLayerIndex: number
): CustomNodeModel | null {
  for (let layerIndex = 0; layerIndex <= maxLayerIndex; layerIndex++) {
    const layerId = layerIndex === 0 ? NodeTypes.Origin : NodeTypes.Via + layerIndex;
    const id = getId(layerId, entity);
    if (nodeMap.has(id)) {
      return nodeMap.get(id)!;
    }
  }
  return null;
}

function createLink(
  sourceNode: CustomNodeModel,
  targetNode: CustomNodeModel,
  sourcePortName: string,
  targetPortName: string
): DefaultLinkModel | null {
  const sourcePort = sourceNode.getPort(sourcePortName);
  const targetPort = targetNode.getPort(targetPortName);
  if (sourcePort && targetPort) {
    const link = new DefaultLinkModel({locked: true});
    link.setSourcePort(sourcePort);
    link.setTargetPort(targetPort);
    link.getOptions().curvyness = 0;
    return link;
  }
  return null;
}

function updateNodeOptions(
  sourceNode: CustomNodeModel,
  targetNode: CustomNodeModel,
  targetType: string
) {
  const sourceOptions = sourceNode.getOptions() as CustomNodeOptions;
  const targetOptions = targetNode.getOptions() as CustomNodeOptions;
  sourceOptions.to?.push({name: targetNode.name, type: targetType});
  targetOptions.from?.push({name: sourceNode.name, type: sourceNode.getCustomType()});
}

function filterForwardConnections(forwardConnection: any[], entity: AnatomicalEntity): any[] {
  return forwardConnection.filter(single_fw => {
    const origins = single_fw.origins.map((origin: { id: string } | string) =>
      typeof origin === 'object' ? origin.id : origin
    );
    return origins.includes(entity.id);
  });
}