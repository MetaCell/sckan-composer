import React, {useRef, useState} from "react";
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
import InfoMenu from "./InfoMenu";
import NavigationMenu from "./NavigationMenu";
import {makeStyles} from "@mui/styles";
import {Theme} from "@mui/material/styles";

const useStyles = makeStyles((theme: Theme) => ({
    canvasBG: {
        background: 'silver',
    },
    container: {
        height: '100%',
        width: '100%',
        position: 'relative',
    },

}));
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

const GraphDiagram: React.FC<GraphDiagramProps> = ({origins, vias, destinations}) => {
    const classes = useStyles();
    const engineRef = useRef<any>(null);
    const [hasMounted, setHasMounted] = useState(false)

    const processData = (
        origins: AnatomicalEntity[] | undefined,
        vias: ViaSerializerDetails[] | undefined,
        destinations: DestinationSerializerDetails[] | undefined,
    ): { nodes: MetaNodeModel[], links: MetaLinkModel[] } => {
        const nodes: MetaNodeModel[] = [];
        const links: MetaLinkModel[] = [];

        const nodeMap = new Map<string, MetaNodeModel>();

        const yStart = 100
        const yIncrement = 200; // Vertical spacing
        const xIncrement = 200; // Horizontal spacing
        let xOrigin = 100

        origins?.forEach(origin => {
            const id = getId(NodeTypes.Origin, origin)
            const originMetaNode = new MetaNode(id, origin.name, NodeTypes.Origin,
                new Point(xOrigin, yStart), '', undefined, [], [], new Map());
            const originNode = originMetaNode.toModel();
            // @ts-ignore
            originNode.addPort(new MetaPortModel(false, 'out', 'Out'));
            nodes.push(originNode);
            nodeMap.set(id, originNode);
            xOrigin += xIncrement;
        });


        vias?.forEach((via) => {
            const layerIndex = via.order + 1
            let xVia = 100
            let yVia = layerIndex * yIncrement + yStart;
            via.anatomical_entities.forEach(entity => {
                const id = getId(NodeTypes.Via + layerIndex, entity)
                const viaMetaNode = new MetaNode(id, entity.name, NodeTypes.Via,
                    new Point(xVia, yVia), '', undefined, [], [], new Map());
                const viaNode = viaMetaNode.toModel()
                // @ts-ignore
                viaNode.addPort(new MetaPortModel(false, 'out', 'Out'));
                // @ts-ignore
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


        const yDestination = yIncrement * ((vias?.length || 1) + 1) + yStart
        let xDestination = 100


        // Process Destinations
        destinations?.forEach(destination => {
            destination.anatomical_entities.forEach(entity => {
                const destinationMetaNode = new MetaNode(getId(NodeTypes.Destination, entity), entity.name, NodeTypes.Destination,
                    new Point(xDestination, yDestination), '', undefined, [], [], new Map());
                const destinationNode = destinationMetaNode.toModel()
                // @ts-ignore
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

    const onMount = (engine: any) => {
        engineRef.current = engine
        // @ts-ignore
        window.engine = engine
        // const state = engineRef.current?.getStateMachine().currentState
        // if(state.createLink){
        //     state.createLink.config.allowCreate = false;
        // }
        // state.unsetCreateLinkState()
        // state.setDragState();
        // if(state.dragCanvas){
        //     state.dragCanvas.config.allowDrag = true;
        // }
        setHasMounted(true)
    }

    console.log(engineRef.current?.getStateMachine().stateStack)


    return (
        <div className={classes.container}>
            <NavigationMenu engine={engineRef.current}/>
            <InfoMenu engine={engineRef.current}/>
            <MetaDiagram
                metaCallback={() => {}}
                metaNodes={nodes as unknown as MetaNodeModel[]}
                metaLinks={links as unknown as MetaLinkModel[]}
                componentsMap={componentsMap}
                metaTheme={{
                    customThemeVariables: {},
                    canvasClassName: classes.canvasBG,
                }}
                wrapperClassName={classes.container}
                globalProps={{}}
                onMount={onMount}
            />
        </div>

    );
}

export default GraphDiagram;

