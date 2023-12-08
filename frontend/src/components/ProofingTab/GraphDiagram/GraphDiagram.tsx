import React, {useEffect, useState} from "react";
import {
    AnatomicalEntity,
    DestinationSerializerDetails,
    ViaSerializerDetails
} from "../../../apiclient/backend";
import InfoMenu from "./InfoMenu";
import NavigationMenu from "./NavigationMenu";
import {makeStyles} from "@mui/styles";
import {Theme} from "@mui/material/styles";
import createEngine, {
    DefaultLinkModel,
    DiagramModel,
} from '@projectstorm/react-diagrams';
import {CanvasWidget} from '@projectstorm/react-canvas-core';
import {CustomNodeModel} from "./Models/CustomNodeModel";
import {CustomNodeFactory} from "./Factories/CustomNodeFactory";

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

function findNodeForEntity(entity: AnatomicalEntity, nodeMap: Map<string, CustomNodeModel>, maxLayerIndex: number) {
    for (let layerIndex = 0; layerIndex <= maxLayerIndex; layerIndex++) {
        let layerId = layerIndex === 0 ? NodeTypes.Origin : NodeTypes.Via + layerIndex
        let id = getId(layerId, entity);
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
        return link;
    }
    return null;
};

const processData = (
    origins: AnatomicalEntity[] | undefined,
    vias: ViaSerializerDetails[] | undefined,
    destinations: DestinationSerializerDetails[] | undefined,
): { nodes: CustomNodeModel[], links: DefaultLinkModel[] } => {
    const nodes: CustomNodeModel[] = [];
    const links: DefaultLinkModel[] = [];

    const nodeMap = new Map<string, CustomNodeModel>();

    const yStart = 100
    const yIncrement = 200; // Vertical spacing
    const xIncrement = 200; // Horizontal spacing
    let xOrigin = 100

    origins?.forEach(origin => {
        const id = getId(NodeTypes.Origin, origin)
        const originNode = new CustomNodeModel(
            NodeTypes.Origin,
            origin.name,
        );
        originNode.setPosition(xOrigin, yStart);
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
            const viaNode = new CustomNodeModel(
                NodeTypes.Via,
                entity.name,
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
            const destinationNode = new CustomNodeModel(
                NodeTypes.Destination,
                entity.name,
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
                    }
                }
            });
        });
    });

    return {nodes, links};
};

const GraphDiagram: React.FC<GraphDiagramProps> = ({origins, vias, destinations}) => {
    const classes = useStyles();
    const [engine] = useState(() => createEngine());
    const [modelUpdated, setModelUpdated] = useState(false)

    // This effect runs once to set up the engine
    useEffect(() => {
        engine.getNodeFactories().registerFactory(new CustomNodeFactory() as any);
    }, [engine]);


    // This effect runs whenever origins, vias, or destinations change
    useEffect(() => {
        const { nodes, links } = processData(origins, vias, destinations);

        const model = new DiagramModel();
        model.addAll(...nodes, ...links);

        engine.setModel(model);
        setModelUpdated(true)
    }, [origins, vias, destinations, engine]);


    return (
        modelUpdated ? <div className={classes.container}>
            <NavigationMenu engine={engine}/>
            <InfoMenu engine={engine}/>
            <CanvasWidget className={classes.container} engine={engine}/>
        </div> : null
    );
}

export default GraphDiagram;

