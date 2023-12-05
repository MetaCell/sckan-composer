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
    MetaNodeModel, MetaLinkModel, MetaPortModel,
} from '@metacell/meta-diagram';
import {OriginNodeWidget} from "./Widgets/OriginNodeWidget";
import {ViaNodeWidget} from "./Widgets/ViaNodeWidget";
import {DestinationNodeWidget} from "./Widgets/DestinationNodeWidget";
import {Point} from "@projectstorm/geometry";
import CustomLinkWidget from "./Widgets/CustomLinkWidget";
import {withStyles} from "@mui/styles";
import {sidebarNodes} from "./Sidebar";

const styles = () => ({
    canvasBG: {
        background: `grey`,
    },

    container: {
        height: '100%',
        width: '100%',
    },

    sidebar: {
        '& .sidebar': {
            position: 'relative',
        },
    }
});

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
    classes: any
}


function getId(layerId: string, entity: AnatomicalEntity) {
    return layerId + entity.id.toString();
}

function findNodeForEntity(entity: AnatomicalEntity, nodeMap: Map<string, MetaNodeModel>, maxLayerIndex: number) {
    for (let layerIndex = 0; layerIndex <= maxLayerIndex; layerIndex++) {
        let layerId = layerIndex === 0 ? NodeTypes.Origin : NodeTypes.Via + layerIndex
        let id = getId(layerId, entity);
        if (nodeMap.has(id)) {
            return nodeMap.get(id);
        }
    }
    return null;
}

const createLink = (sourceNode: MetaNodeModel, targetNode: MetaNodeModel, sourcePortName: string, targetPortName: string) => {
    const sourcePort = sourceNode.getPort(sourcePortName);
    const targetPort = targetNode.getPort(targetPortName);
    if (sourcePort && targetPort) {
        const sourceNodeId = sourceNode.getOptions().id || ''
        const targetNodeId = targetNode.getOptions().id || ''
        const metaLink = new MetaLink(
            'link-' + sourceNodeId + '-' + targetNodeId,
            'Link between ' + sourceNodeId + ' and ' + targetNodeId,
            LinkTypes.Default,
            sourceNodeId,
            sourcePortName,
            targetNodeId,
            targetPortName,
            '',
            new Map()
        );
        const link = metaLink.toModel()
        link.setSourcePort(sourcePort);
        link.setTargetPort(targetPort);
        return link;
    }
    return null;
};

const GraphDiagram: React.FC<GraphDiagramProps> = ({origins, vias, destinations, classes}) => {
    const diagramRef = useRef<any>(null);

    const processData = (
        origins: AnatomicalEntity[] | undefined,
        vias: ViaSerializerDetails[] | undefined,
        destinations: DestinationSerializerDetails[] | undefined,
    ): { nodes: MetaNodeModel[], links: MetaLinkModel[] } => {
        const nodes: MetaNodeModel[] = [];
        const links: MetaLinkModel[] = [];

        const nodeMap = new Map<string, MetaNodeModel>();

        const yIncrement = 100; // Vertical spacing
        const xIncrement = 100; // Horizontal spacing
        let xOrigin = 0

        origins?.forEach(origin => {
            const id = getId(NodeTypes.Origin, origin)
            const originMetaNode = new MetaNode(id, origin.name, NodeTypes.Origin,
                new Point(xOrigin, 0), '', undefined, [], [], new Map());
            const originNode = originMetaNode.toModel();
            originNode.addPort(new MetaPortModel(false, 'out', 'Out'));
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
                const viaMetaNode = new MetaNode(id, entity.name, NodeTypes.Via,
                    new Point(xVia, yVia), '', undefined, [], [], new Map());
                const viaNode = viaMetaNode.toModel()
                viaNode.addPort(new MetaPortModel(false, 'out', 'Out'));
                viaNode.addPort(new MetaPortModel(true, 'in', 'In'));
                nodes.push(viaNode);
                nodeMap.set(id, viaNode);
                xVia += xIncrement

                via.from_entities.forEach(fromEntity => {
                    const sourceNode = findNodeForEntity(fromEntity, nodeMap, layerIndex - 1);
                    if (sourceNode) {
                        const link = createLink(sourceNode, viaNode, 'out', 'in');
                        if (link) {
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
                const destinationMetaNode = new MetaNode(getId(NodeTypes.Destination, entity), entity.name, NodeTypes.Destination,
                    new Point(xDestination, yDestination), '', undefined, [], [], new Map());
                const destinationNode = destinationMetaNode.toModel()
                destinationNode.addPort(new MetaPortModel(true, 'in', 'In'));
                nodes.push(destinationNode);
                xDestination += xIncrement;
                xDestination += xIncrement;
                destination.from_entities.forEach(fromEntity => {
                    const sourceNode = findNodeForEntity(fromEntity, nodeMap, vias?.length || 0);
                    if (sourceNode) {
                        const link = createLink(sourceNode, destinationNode, 'out', 'in');
                        if (link) {
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
        [NodeTypes.Origin, OriginNodeWidget],
        [NodeTypes.Via, ViaNodeWidget],
        [NodeTypes.Destination, DestinationNodeWidget],
    ]);

    const linkComponentsMap = new Map<string, React.ComponentType<any>>([
        [LinkTypes.Default, CustomLinkWidget],
    ]);
    const componentsMap = new ComponentsMap(nodeComponentsMap, linkComponentsMap);

    return (
        <MetaDiagram
            ref={diagramRef}
            metaCallback={() => {
            }}
            metaNodes={nodes as unknown as MetaNodeModel[]}
            metaLinks={links as unknown as MetaLinkModel[]}
            componentsMap={componentsMap}
            sidebarNodes={sidebarNodes}
            metaTheme={{
                customThemeVariables: {},
                canvasClassName: classes.canvasBG,
            }}
            wrapperClassName={classes.container + " " + classes.sidebar}
            globalProps={{
                disableZoom: false,
                disableMoveCanvas: false,
                disableMoveNodes: true,
                disableDeleteDefaultKey: true,
            }}
        />
    );
}

export default withStyles(styles)(GraphDiagram);

