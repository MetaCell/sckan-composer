import { DefaultLinkModel } from "@projectstorm/react-diagrams";
import {
  AnatomicalEntity,
  ViaSerializerDetails,
  DestinationSerializerDetails,
  TypeC11Enum,
  TypeB60Enum
} from "../apiclient/backend";
import { CustomNodeModel } from "../components/ProofingTab/GraphDiagram/Models/CustomNodeModel";
import { CustomNodeOptions, NodeTypes } from "../components/ProofingTab/GraphDiagram/GraphDiagram";

const ViaTypeMapping: Record<TypeB60Enum, string> = {
  [TypeB60Enum.Axon]: 'Axon',
  [TypeB60Enum.Dendrite]: 'Dendrite'
};

export const DestinationTypeMapping: Record<TypeC11Enum, string> = {
  [TypeC11Enum.AxonT]: 'Axon terminal',
  [TypeC11Enum.AfferentT]: 'Afferent terminal',
  [TypeC11Enum.Unknown]: 'Not specified'
};

interface EntityInfo {
  entity: AnatomicalEntity;
  nodeType: NodeTypes;
  anatomicalType?: string;
  from_entities: AnatomicalEntity[];
  to_entities: AnatomicalEntity[];
}

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

  // Collect entity information and mappings
  const entityMap = collectEntityMap(origins, vias, destinations);

  // Identify afferent terminal IDs
  const afferentTerminalIds = [...entityMap.entries()]
    .filter(
      ([_, info]) =>
        info.nodeType === NodeTypes.Destination && info.anatomicalType === TypeC11Enum.AfferentT
    )
    .map(([id, _]) => id);

  // Identify non-afferent destination IDs
  const nonAfferentDestinationIds = [...entityMap.entries()]
    .filter(
      ([_, info]) =>
        info.nodeType === NodeTypes.Destination && info.anatomicalType !== TypeC11Enum.AfferentT
    )
    .map(([id, _]) => id);

  // Process paths from afferent terminals back to origins
  let maxLevelAfferent = 0;
  afferentTerminalIds.forEach(entityId => {
    const level = traverseFromAfferentTerminal(
      entityId,
      entityMap,
      nodeMap,
      nodes,
      links,
      existingPositions,
      0 // initial level
    );
    if (level > maxLevelAfferent) {
      maxLevelAfferent = level;
    }
  });

  // Process paths from non-afferent destinations back to origins
  nonAfferentDestinationIds.forEach(entityId => {
    const { nodes: traversalNodes, links: traversalLinks } = traverseFromNonAfferentTerminal(
      entityId,
      entityMap,
      nodeMap,
      existingPositions,
      maxLevelAfferent + 1 // initial level
    );

    // Add nodes and links if they are not already in the main arrays
    traversalNodes.forEach(node => {
      if (!nodes.includes(node)) {
        nodes.push(node);
      }
    });

    links.push(...traversalLinks);
  });

  // Process forward connections for destinations
  processForwardConnections(forwardConnection, nodeMap);

  return { nodes, links };
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
    const position = model.position || { x: model.x, y: model.y };
    if (externalId && position && customType) {
      if (!positions.has(customType)) {
        positions.set(customType, new Map());
      }
      positions.get(customType)!.set(externalId, { x: position.x, y: position.y });
    }
  });
  return positions;
}


function collectEntityMap(
  origins: AnatomicalEntity[] | undefined,
  vias: ViaSerializerDetails[] | undefined,
  destinations: DestinationSerializerDetails[] | undefined
): Map<string, EntityInfo> {
  const entityMap = new Map<string, EntityInfo>();

  // Helper function to get or create EntityInfo
  const getOrCreateEntityInfo = (entityId: string, entity: AnatomicalEntity, nodeType: NodeTypes = NodeTypes.Via): EntityInfo => {
    if (!entityMap.has(entityId)) {
      entityMap.set(entityId, {
        entity,
        nodeType,
        from_entities: [],
        to_entities: [],
      });
    }
    return entityMap.get(entityId)!;
  };

  // Process origins
  origins?.forEach(origin => {
    const entityId = origin.id.toString();
    getOrCreateEntityInfo(entityId, origin, NodeTypes.Origin);
  });

  // Process vias
  vias?.forEach(via => {
    const anatomicalType = via.type;
    via.anatomical_entities.forEach(entity => {
      const entityId = entity.id.toString();
      const entityInfo = getOrCreateEntityInfo(entityId, entity, NodeTypes.Via);
      entityInfo.anatomicalType = anatomicalType;

      // Set from_entities
      entityInfo.from_entities = via.from_entities;

      // Update to_entities of from_entities
      via.from_entities.forEach(fromEntity => {
        const fromEntityId = fromEntity.id.toString();
        const fromEntityInfo = getOrCreateEntityInfo(fromEntityId, fromEntity);
        fromEntityInfo.to_entities.push(entity);
      });
    });
  });

  // Process destinations
  destinations?.forEach(destination => {
    const anatomicalType = destination.type;
    destination.anatomical_entities.forEach(entity => {
      const entityId = entity.id.toString();
      const entityInfo = getOrCreateEntityInfo(entityId, entity, NodeTypes.Destination);
      entityInfo.anatomicalType = anatomicalType;

      // Set from_entities
      entityInfo.from_entities = destination.from_entities;

      // Update to_entities of from_entities
      destination.from_entities.forEach(fromEntity => {
        const fromEntityId = fromEntity.id.toString();
        const fromEntityInfo = getOrCreateEntityInfo(fromEntityId, fromEntity, NodeTypes.Via);
        fromEntityInfo.to_entities.push(entity);
      });
    });
  });

  return entityMap;
}

function traverseFromAfferentTerminal(
  entityId: string,
  entityMap: Map<string, EntityInfo>,
  nodeMap: Map<string, CustomNodeModel>,
  nodes: CustomNodeModel[],
  links: DefaultLinkModel[],
  existingPositions: Map<string, Map<string, { x: number; y: number }>>,
  level: number
): number {
  const visited = new Set<string>();
  const stack: { id: string; level: number }[] = [{ id: entityId, level }];
  let maxLevel = level;
  const levelXPositions = new Map<number, number>();

  while (stack.length > 0) {
    const { id: currentId, level } = stack.pop()!;
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);
    if (level > maxLevel) {
      maxLevel = level;
    }

    const entityInfo = entityMap.get(currentId);
    if (!entityInfo) {
      console.warn(`Entity with ID ${currentId} not found in entityMap.`);
      continue;
    }

    // Get or create current node
    const { node: currentNode, created: isCurrentNodeNew } = getOrCreateNode(
      currentId,
      entityInfo,
      nodeMap,
      existingPositions,
      level,
      levelXPositions,
      nodes
    );

    // Add to nodes array if new
    if (isCurrentNodeNew) {
      nodes.push(currentNode);
    }

    // Process from_entities
    entityInfo.from_entities.forEach(fromEntity => {
      const fromId = fromEntity.id.toString();

      // Add to stack
      if (!visited.has(fromId)) {
        stack.push({ id: fromId, level: level + 1 });
      }

      const fromEntityInfo = entityMap.get(fromId);
      if (!fromEntityInfo) {
        console.warn(`Entity with ID ${fromId} not found in entityMap.`);
        return;
      }

      // Get or create from node
      const { node: fromNode, created: isFromNodeNew } = getOrCreateNode(
        fromId,
        fromEntityInfo,
        nodeMap,
        existingPositions,
        level + 1,
        levelXPositions,
        nodes
      );

      // Add to nodes array if new
      if (isFromNodeNew) {
        nodes.push(fromNode);
      }

      // Create link from current node to from node
      const link = createLink(currentNode, fromNode, 'out', 'in');
      if (link) {
        links.push(link);
        updateNodeOptions(currentNode, fromNode, fromNode.getCustomType());
      }
    });
  }

  return maxLevel;
}

function traverseFromNonAfferentTerminal(
  entityId: string,
  entityMap: Map<string, EntityInfo>,
  nodeMap: Map<string, CustomNodeModel>,
  existingPositions: Map<string, Map<string, { x: number; y: number }>>,
  initialLevel: number
): { nodes: CustomNodeModel[]; links: DefaultLinkModel[]; maxLevel: number } {
  const visited = new Set<string>();
  const stack: { id: string; level: number }[] = [{ id: entityId, level: initialLevel }];
  const newNodes: { node: CustomNodeModel; level: number }[] = [];
  const newLinks: DefaultLinkModel[] = [];
  let maxLevel = initialLevel;
  const levelXPositions = new Map<number, number>();


  while (stack.length > 0) {
    const { id: currentId, level } = stack.pop()!;
    if (visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);

    if (level > maxLevel) {
      maxLevel = level;
    }

    const entityInfo = entityMap.get(currentId);
    if (!entityInfo) {
      console.warn(`Entity with ID ${currentId} not found in entityMap.`);
      continue;
    }

    // Get or create current node
    const { node: currentNode, created: isCurrentNodeNew } = getOrCreateNode(
      currentId,
      entityInfo,
      nodeMap,
      existingPositions,
      level,
      levelXPositions,
      newNodes.map(n => n.node)
    );

    if (isCurrentNodeNew) {
      newNodes.push({ node: currentNode, level });
    }

    // Process from_entities
    entityInfo.from_entities.forEach(fromEntity => {
      const fromId = fromEntity.id.toString();

      // Add to stack
      if (!visited.has(fromId)) {
        stack.push({ id: fromId, level: level + 1 });
      }

      const fromEntityInfo = entityMap.get(fromId);
      if (!fromEntityInfo) {
        console.warn(`Entity with ID ${fromId} not found in entityMap.`);
        return;
      }

      const { node: fromNode, created: isFromNodeNew } = getOrCreateNode(
        fromId,
        fromEntityInfo,
        nodeMap,
        existingPositions,
        level + 1,
        levelXPositions,
        newNodes.map(n => n.node)
      );

      if (isFromNodeNew) {
        newNodes.push({ node: fromNode, level: level + 1 });
      }
      // Create link from fromNode to currentNode (since we're traversing backward)
      const link = createLink(fromNode, currentNode, 'out', 'in');
      if (link) {
        newLinks.push(link);
        updateNodeOptions(fromNode, currentNode, currentNode.getCustomType());
      }
    });
  }

  // Reverse the order of nodes and links
  newNodes.reverse();
  newLinks.reverse();

  // Position nodes with correct Y values
  adjustNodesYPosition(newNodes, existingPositions);

  return { nodes: newNodes.map(n => n.node), links: newLinks, maxLevel };
}

function adjustNodesYPosition(
  traversalNodes: { node: CustomNodeModel; level: number }[],
  existingPositions: Map<string, Map<string, { x: number; y: number }>>,
) {

  traversalNodes.forEach(({ node, level }) => {
    const defaultY = POSITION_CONSTANTS.yStart + level * POSITION_CONSTANTS.yIncrement;

    setPosition(node, existingPositions, node.getX(), defaultY, traversalNodes.map(n => n.node));
  });
}

function processForwardConnections(
  forwardConnections: any[],
  nodeMap: Map<string, CustomNodeModel>
) {
  // Filter nodes to get only Destination nodes
  const destinationNodes = Array.from(nodeMap.values()).filter(
    node => node.customType === NodeTypes.Destination
  );

  // Iterate over Destination nodes
  destinationNodes.forEach(node => {
    const externalId = node.externalId;

    // Find forward connections where this node's externalId is in the destinations
    const relevantForwardConnections = forwardConnections.filter(single_fw => {
      const destinations = single_fw.destinations.map((destination: { id: string } | string) =>
        typeof destination === 'object' ? destination.id.toString() : destination.toString()
      );
      return destinations.includes(externalId);
    });

    if (relevantForwardConnections.length > 0) {
      const nodeOptions = node.getOptions() as CustomNodeOptions;
      // Update the forward_connection attribute
      nodeOptions.forward_connection.push(...relevantForwardConnections);
    }
  });
}



// Utility functions


function getEntityNameAndUri(entity: AnatomicalEntity): { name: string; ontology_uri: string } {
  const name = entity.simple_entity
    ? entity.simple_entity.name
    : `${entity.region_layer.region.name}(${entity.region_layer.layer.name})`;
  const ontology_uri = entity.simple_entity
    ? entity.simple_entity.ontology_uri
    : `${entity.region_layer.region.ontology_uri}, ${entity.region_layer.layer.ontology_uri}`;
  return { name, ontology_uri };
}

function setPosition(
  node: CustomNodeModel,
  existingPositions: Map<string, Map<string, { x: number; y: number }>>,
  defaultX: number,
  defaultY: number,
  nodes: CustomNodeModel[]
) {
  const externalId = node.externalId;
  const customType = node.getCustomType();

  if (existingPositions.has(customType) && existingPositions.get(customType)!.has(externalId)) {
    const position = existingPositions.get(customType)!.get(externalId)!;
    node.setPosition(position.x, position.y);
  } else {
    const { x, y } = findNonOverlappingPosition(defaultX, defaultY, nodes);
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

  return { x: newX, y: newY };
}

function createNode(entityInfo: EntityInfo): CustomNodeModel {
  const { entity, nodeType, anatomicalType } = entityInfo;
  const { name } = getEntityNameAndUri(entity);
  const externalId = entity.id.toString();

  const options: CustomNodeOptions = {
    forward_connection: [],
    from: [],
    to: [],
    anatomicalType,
  };

  return new CustomNodeModel(nodeType, name, externalId, options);
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
    const link = new DefaultLinkModel({ locked: true });
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
  sourceOptions.to?.push({ name: targetNode.name, type: targetType });
  targetOptions.from?.push({ name: sourceNode.name, type: sourceNode.getCustomType() });
}

function getOrCreateNode(
  nodeId: string,
  entityInfo: EntityInfo,
  nodeMap: Map<string, CustomNodeModel>,
  existingPositions: Map<string, Map<string, { x: number; y: number }>>,
  level: number,
  levelXPositions: Map<number, number>,
  allNodes: CustomNodeModel[]
): { node: CustomNodeModel; created: boolean } {
  let node = nodeMap.get(nodeId);
  let created = false;
  if (!node) {
    node = createNode(entityInfo);
    // Set position
    const defaultY = POSITION_CONSTANTS.yStart + level * POSITION_CONSTANTS.yIncrement;
    const defaultX = levelXPositions.get(level) || POSITION_CONSTANTS.xStart;
    setPosition(node, existingPositions, defaultX, defaultY, allNodes);
    nodeMap.set(nodeId, node);
    // Update x position for this level
    levelXPositions.set(level, defaultX + POSITION_CONSTANTS.xIncrement);
    created = true;
  }
  return { node, created };
}

