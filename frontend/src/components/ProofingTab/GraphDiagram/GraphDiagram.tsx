import React, {useRef} from "react";
import {
    AnatomicalEntity,
    Destination,
    DestinationSerializerDetails,
    Via,
    ViaSerializerDetails
} from "../../../apiclient/backend";
import MetaDiagram, {
    MetaNodeModel,
    MetaLinkModel,
    ComponentsMap,
    MetaNode,
    MetaLink,
    MetaPort, PortTypes,
} from '@metacell/meta-diagram';
import {OriginNode} from "./Widgets/OriginNode";
import {ViaNode} from "./Widgets/ViaNode";
import {DestinationNode} from "./Widgets/DestinationNode";
import {DefaultLinkWidget} from '@projectstorm/react-diagrams';
import {makeStyles} from "@mui/styles";
import BG from '../../../assets/canvas-bg-dotted.svg';
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

const useStyles = makeStyles({
    canvasBG: {
        backgroundImage: `url(${BG})`,
    },
});

const GraphDiagram: React.FC<GraphDiagramProps> = ({origins, vias, destinations}) => {
    const classes = useStyles();
    const diagramRef = useRef<any>(null);

    const processData = (
        origins: AnatomicalEntity[] | undefined,
        vias: ViaSerializerDetails[] | undefined,
        destinations: DestinationSerializerDetails[] | undefined,
    ): { nodes: MetaNode[], links: MetaLink[] } => {
        const nodes: MetaNode[] = [];
        let xOrigin = 0, xVia = 0
        const yIncrement = 100; // Vertical spacing
        const xIncrement = 100; // Horizontal spacing

        origins?.forEach(origin => {
            const originNode = new MetaNode(
                origin.id.toString(),
                origin.name,
                NodeTypes.Origin,
                new Point(xOrigin, yIncrement),
                '',
                undefined,
                [new MetaPort('out', 'out', PortTypes.OUTPUT_PORT, new Point(0, 0), new Map())],
                undefined,
                new Map(),
            );
            nodes.push(originNode);
            xOrigin += xIncrement;
        });

        const yDestination = yIncrement * (vias?.length || 1) + yIncrement
        let xDestination = 0
        // Process Destinations
        destinations?.flatMap(d => d.anatomical_entities).forEach(entity => {
            const destinationNode = new MetaNode(
                entity.id.toString(),
                entity.name,
                NodeTypes.Destination,
                new Point(xDestination, yDestination),
                '',
                undefined,
                [new MetaPort('in', 'in', PortTypes.INPUT_PORT, new Point(0, 0), new Map())],
                undefined,
                new Map(),
            );
            nodes.push(destinationNode);
            xDestination += xIncrement;
        });


        return {nodes, links: []};
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
            globalProps={{
                disableMoveNodes: true,
                disableDeleteDefaultKey: true,
            }}

        />
    );
}

export default GraphDiagram;
