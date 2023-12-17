import { AbstractReactFactory } from '@projectstorm/react-canvas-core';
import {NodeTypes} from "../GraphDiagram";
import {CustomNodeModel} from "../Models/CustomNodeModel";
import React from "react";
import {OriginNodeWidget} from "../Widgets/OriginNodeWidget";
import {ViaNodeWidget} from "../Widgets/ViaNodeWidget";
import {DestinationNodeWidget} from "../Widgets/DestinationNodeWidget";

export class CustomNodeFactory extends AbstractReactFactory {
    constructor() {
        super('custom');
    }

    generateModel() {
        return new CustomNodeModel(NodeTypes.Origin, '');
    }

    // @ts-ignore
    generateReactWidget(event: any) {
        const { customType } = event.model;

        switch (customType) {
            case NodeTypes.Origin:
                return <OriginNodeWidget engine={this.engine} model={event.model} />;
            case NodeTypes.Via:
                return <ViaNodeWidget engine={this.engine} model={event.model} />;
            case NodeTypes.Destination:
                return <DestinationNodeWidget engine={this.engine} model={event.model} />;
            default:
                return null;
        }
    }
}
