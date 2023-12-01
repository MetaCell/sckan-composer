import React, {useRef} from "react";
import {
    AnatomicalEntity,
    DestinationSerializerDetails,
    ViaSerializerDetails
} from "../../../apiclient/backend";
import MetaDiagram, {
    ComponentsMap,
    MetaNode,
    MetaLink,
    MetaPort, PortTypes,
} from '@metacell/meta-diagram';
import {OriginNode} from "./Widgets/OriginNode";
import {ViaNode} from "./Widgets/ViaNode";
import {DestinationNode} from "./Widgets/DestinationNode";
import {DefaultLinkWidget} from '@projectstorm/react-diagrams';
import {Point} from "@projectstorm/geometry";


export enum NodeTypes {
    Origin = 'Origin',
    Via = 'Via',
    Destination = 'Destination'
}

export enum LinkTypes {
    Default = 'Default'
}

interface GraphDiagramProps {
    origins: AnatomicalEntity[] | undefined;
    vias: ViaSerializerDetails[] | undefined;
    destinations: DestinationSerializerDetails[] | undefined;
}


function getId(layerId: string, entity: AnatomicalEntity) {
    return layerId + entity.id.toString();
}

function findNodeIdForEntity(entity: AnatomicalEntity, nodeMap: Map<string, MetaNode>, maxLayerIndex: number) {
    for (let layerIndex = 0; layerIndex <= maxLayerIndex; layerIndex++) {
        let layerId = layerIndex == 0 ? NodeTypes.Origin : NodeTypes.Via + layerIndex
        let id = getId(layerId, entity);
        if (nodeMap.has(id)) {
            return id;
        }
    }
    return null;
}

function createLink(sourceNodeId: string, targetNodeId: string) {
    return new MetaLink(
        'link-' + sourceNodeId + '-' + targetNodeId,
        'Link between ' + sourceNodeId + ' and ' + targetNodeId,
        'default',
        sourceNodeId,
        'out',
        targetNodeId,
        'in',
        '',
        new Map()
    );
}

const GraphDiagram: React.FC<GraphDiagramProps> = ({origins, vias, destinations}) => {
    const diagramRef = useRef<any>(null);

    const processData = (
        origins: AnatomicalEntity[] | undefined,
        vias: ViaSerializerDetails[] | undefined,
        destinations: DestinationSerializerDetails[] | undefined,
    ): { nodes: MetaNode[], links: MetaLink[] } => {
        const nodes: MetaNode[] = [];
        const links: MetaLink[] = [];

        const nodeMap = new Map<string, MetaNode>();

        const yIncrement = 100; // Vertical spacing
        const xIncrement = 100; // Horizontal spacing
        let xOrigin = 0

        origins?.forEach(origin => {
            const originNode = new MetaNode(
                getId(NodeTypes.Origin, origin),
                origin.name,
                NodeTypes.Origin,
                new Point(xOrigin, 0),
                '',
                undefined,
                [new MetaPort('out', 'out', PortTypes.OUTPUT_PORT, new Point(600, 1000), new Map())],
                undefined,
                new Map(),
            );
            nodes.push(originNode);
            nodeMap.set(originNode.getId(), originNode);
            xOrigin += xIncrement;
        });


        vias?.forEach((via, layerIndex) => {
            let xVia = 0
            let yVia = (layerIndex + 1) * yIncrement; // Calculate y-coordinate based on layer
            via.anatomical_entities.forEach(entity => {
                const viaNode = new MetaNode(
                    getId(NodeTypes.Via + layerIndex, entity),
                    entity.name,
                    NodeTypes.Via,
                    new Point(xVia, yVia),
                    '',
                    undefined,
                    [new MetaPort('out', 'out', PortTypes.OUTPUT_PORT, new Point(600, 1000), new Map()),
                        new MetaPort('in', 'in', PortTypes.INPUT_PORT, new Point(600, 1000), new Map())],
                    undefined,
                    new Map(),
                );
                nodes.push(viaNode);
                nodeMap.set(viaNode.getId(), viaNode);
                xVia += xIncrement

                via.from_entities.forEach(fromEntity => {
                    const sourceNodeId = findNodeIdForEntity(fromEntity, nodeMap, layerIndex - 1);
                    if (sourceNodeId) {
                        const link = createLink(sourceNodeId, viaNode.getId());
                        links.push(link);
                    }
                });
            });
            yVia += yIncrement;
        });


        const yDestination = yIncrement * ((vias?.length || 1) + 1)
        let xDestination = 0


        // Process Destinations
        destinations?.forEach(destination => {
            destination.anatomical_entities.forEach(entity => {
                const destinationNode = new MetaNode(
                    getId(NodeTypes.Destination, entity),
                    entity.name,
                    NodeTypes.Destination,
                    new Point(xDestination, yDestination),
                    '',
                    undefined,
                    [new MetaPort('in', 'in', PortTypes.INPUT_PORT, new Point(600, 1000), new Map())],
                    undefined,
                    new Map()
                );
                nodes.push(destinationNode);
                nodeMap.set(destinationNode.getId(), destinationNode); // Add to nodeMap for link creation
                xDestination += xIncrement;

                destination.from_entities.forEach(fromEntity => {
                    const sourceNodeId = findNodeIdForEntity(fromEntity, nodeMap, (vias?.length || 1) - 1);
                    if (sourceNodeId) {
                        const link = createLink(sourceNodeId, destinationNode.getId());
                        links.push(link);
                    }
                });
            });
        });

        return {nodes, links};
    };


    const {nodes, links} = processData(origins, vias, destinations);

    const nodeComponentsMap = new Map<string, React.ComponentType<any>>([
        [NodeTypes.Origin, OriginNode],
        [NodeTypes.Via, ViaNode],
        [NodeTypes.Destination, DestinationNode],
    ]);

    const linkComponentsMap = new Map<string, React.ComponentType<any>>([
        [LinkTypes.Default, DefaultLinkWidget],
    ]);
    const componentsMap = new ComponentsMap(nodeComponentsMap, linkComponentsMap);

    return (
        <MetaDiagram
            ref={diagramRef}
            metaNodes={nodes.map(n => n.toModel())}
            metaLinks={links.map(l => l.toModel())}
            componentsMap={componentsMap}
            metaTheme={{
                customThemeVariables: {},
                canvasClassName: '',
            }}
            globalProps={{}}

        />
    );
}

export default GraphDiagram;
