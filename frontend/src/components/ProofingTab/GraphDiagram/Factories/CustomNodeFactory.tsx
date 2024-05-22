import {AbstractReactFactory, GenerateWidgetEvent} from '@projectstorm/react-canvas-core';
import {CustomNodeModel} from "../Models/CustomNodeModel";
import {Fragment} from "react";
import {OriginNodeWidget} from "../Widgets/OriginNodeWidget";
import {ViaNodeWidget} from "../Widgets/ViaNodeWidget";
import {DestinationNodeWidget} from "../Widgets/DestinationNodeWidget";
import {DiagramEngine, NodeModel, NodeModelGenerics} from "@projectstorm/react-diagrams";
import {NodeTypes} from "../GraphDiagram";

export class CustomNodeFactory extends AbstractReactFactory<NodeModel<NodeModelGenerics>, DiagramEngine>  {
    constructor() {
        super('custom');
    }

    generateModel() {
        return new CustomNodeModel(NodeTypes.Origin, '');
    }

    generateReactWidget(event: GenerateWidgetEvent<CustomNodeModel>) {
        const { customType } = event.model;

        switch (customType) {
            case NodeTypes.Origin:
                return <OriginNodeWidget engine={this.engine} model={event.model} />;
            case NodeTypes.Via:
                return <ViaNodeWidget engine={this.engine} model={event.model} />;
            case NodeTypes.Destination:
                return <DestinationNodeWidget engine={this.engine} model={event.model} />;
            default:
                return <Fragment></Fragment>;
        }
    }
}
