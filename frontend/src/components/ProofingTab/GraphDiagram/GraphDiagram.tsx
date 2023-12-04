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
    MetaPort, PortTypes, MetaNodeModel, MetaLinkModel,
} from '@metacell/meta-diagram';
import {OriginNode} from "./Widgets/OriginNode";
import {ViaNode} from "./Widgets/ViaNode";
import {DestinationNode} from "./Widgets/DestinationNode";
import {DefaultLinkWidget, DefaultPortModel, DefaultNodeModel, DefaultLinkModel} from '@projectstorm/react-diagrams';
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

function findNodeForEntity(entity: AnatomicalEntity, nodeMap: Map<string, DefaultNodeModel>, maxLayerIndex: number) {
    for (let layerIndex = 0; layerIndex <= maxLayerIndex; layerIndex++) {
        let layerId = layerIndex === 0 ? NodeTypes.Origin : NodeTypes.Via + layerIndex
        let id = getId(layerId, entity);
        if (nodeMap.has(id)) {
            return nodeMap.get(id);
        }
    }
    return null;
}

const createLink = (sourceNode: DefaultNodeModel, targetNode: DefaultNodeModel, sourcePortName: string, targetPortName: string) => {
    const sourcePort = sourceNode.getPort(sourcePortName);
    const targetPort = targetNode.getPort(targetPortName);
    if (sourcePort && targetPort) {
        const link = new DefaultLinkModel();
        link.setSourcePort(sourcePort);
        link.setTargetPort(targetPort);
        return link;
    }
    return null;
};

const GraphDiagram: React.FC<GraphDiagramProps> = ({origins, vias, destinations}) => {
    const diagramRef = useRef<any>(null);

    const processData = (
        origins: AnatomicalEntity[] | undefined,
        vias: ViaSerializerDetails[] | undefined,
        destinations: DestinationSerializerDetails[] | undefined,
    ): { nodes: DefaultNodeModel[], links: DefaultLinkModel[] } => {
        const nodes: DefaultNodeModel[] = [];
        const links: DefaultLinkModel[] = [];

        const nodeMap = new Map<string, DefaultNodeModel>();

        const yIncrement = 100; // Vertical spacing
        const xIncrement = 100; // Horizontal spacing
        let xOrigin = 0

        origins?.forEach(origin => {
            const id = getId(NodeTypes.Origin, origin)
            const originNode = new DefaultNodeModel({
                name: id,
                color: 'red' // Set color or other properties as needed
            });
            originNode.setPosition(xOrigin, 0);
            originNode.addPort(new DefaultPortModel(false, 'out', 'Out'));
            nodes.push(originNode);
            nodeMap.set(id, originNode);
            xOrigin += xIncrement;
        });


        vias?.forEach((via) => {
            const layerIndex = via.order + 1
            let xVia = 0
            let yVia = layerIndex * yIncrement;
            via.anatomical_entities.forEach(entity => {
                const id = getId(NodeTypes.Via + layerIndex, entity)

                const viaNode = new DefaultNodeModel({
                    name: id,
                    color: 'yellow'
                });
                viaNode.setPosition(xVia, yVia);
                viaNode.addPort(new DefaultPortModel(false, 'out', 'Out'));
                viaNode.addPort(new DefaultPortModel(true, 'in', 'In'));
                nodes.push(viaNode);
                nodeMap.set(id, viaNode);
                xVia += xIncrement

                via.from_entities.forEach(fromEntity => {
                    const sourceNode = findNodeForEntity(fromEntity, nodeMap,layerIndex - 1);
                    if (sourceNode) {
                        const link = createLink(sourceNode, viaNode, 'out',  'in');
                        if(link){
                            links.push(link);
                        }
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
                const destinationNode = new DefaultNodeModel({
                    name: getId(NodeTypes.Destination, entity),
                    color: 'green'
                });
                destinationNode.setPosition(xDestination, yDestination);
                destinationNode.addPort(new DefaultPortModel(true, 'in', 'In'));
                nodes.push(destinationNode);
                xDestination += xIncrement;
                xDestination += xIncrement;
                destination.from_entities.forEach(fromEntity => {
                    const sourceNode = findNodeForEntity(fromEntity, nodeMap, vias?.length || 0);
                    if (sourceNode) {
                        const link = createLink(sourceNode, destinationNode, 'out', 'in');
                        if(link){
                            links.push(link);
                        }
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
            metaNodes={nodes as unknown as MetaNodeModel[]}
            metaLinks={links as unknown as MetaLinkModel[]}
            componentsMap={componentsMap}
            metaTheme={{
                customThemeVariables: {},
                canvasClassName: '',
            }}
            globalProps={{
                disableZoom: false,
                disableMoveCanvas: false,
                disableMoveNodes: true,
                disableDeleteDefaultKey: true,
            }}
        />
    );
}

export default GraphDiagram;
