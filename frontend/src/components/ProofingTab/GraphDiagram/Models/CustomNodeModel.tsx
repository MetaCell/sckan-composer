import { NodeModel, DefaultPortModel } from '@projectstorm/react-diagrams';
import { NodeTypes } from "../GraphDiagram";
import {CustomNodeOptions} from "../GraphDiagram";
import { DestinationTypeMapping } from '../../../../services/GraphDiagramService';
import { TypeC11Enum } from '../../../../apiclient/backend/api';

export class CustomNodeModel extends NodeModel {
    customType: NodeTypes;
    name: string;
    externalId: string;
    constructor(customType: NodeTypes, name: string, externalId: string = '',  options: CustomNodeOptions = {
        forward_connection: []
    }) {
        super({
            ...options,
            type: 'custom',
        });
        this.customType = customType;
        this.name = name;
        this.externalId = externalId;

        this.configurePorts(customType, options);
    }

    configurePorts(customType: NodeTypes, options: CustomNodeOptions): void {
        // Origin nodes have both in and out ports
        if (customType === NodeTypes.Origin) {
            this.addPort(new DefaultPortModel(true, 'in', 'In'));
            this.addPort(new DefaultPortModel(false, 'out', 'Out'));
        }
        // Via nodes have both in and out ports
        if (customType === NodeTypes.Via) {
            this.addPort(new DefaultPortModel(true, 'in', 'In'));
            this.addPort(new DefaultPortModel(false, 'out', 'Out'));
        }
        // Destination nodes: ports depend on the type of destination
        if (customType === NodeTypes.Destination) {
            if (options.anatomicalType === DestinationTypeMapping[TypeC11Enum.AfferentT]) {
                // Afferent terminals have only an out port
                this.addPort(new DefaultPortModel(false, 'out', 'Out'));
            } else {
                // Other destinations have only an in port
                this.addPort(new DefaultPortModel(true, 'in', 'In'));
            }
        }
    }

    getCustomType() {
        return this.customType;
    }

    getOptions(): CustomNodeOptions {
        return super.getOptions() as CustomNodeOptions;
    }

    // Override serialize to include custom properties and options
    serialize() {
        return {
            ...super.serialize(),
            customType: this.customType,
            name: this.name,
            externalId: this.externalId,
            forward_connection: this.getOptions().forward_connection,
            from: this.getOptions().from,
            to: this.getOptions().to,
            anatomicalType: this.getOptions().anatomicalType,
        };
    }

    // Override deserialize to set custom properties and options
    deserialize(event: any): void {
        super.deserialize(event);
        this.customType = event.data.customType;
        this.name = event.data.name;
        this.externalId = event.data.externalId;

        // Set custom options
        this.getOptions().forward_connection = event.data.forward_connection || [];
        this.getOptions().from = event.data.from || [];
        this.getOptions().to = event.data.to || [];
        this.getOptions().anatomicalType = event.data.anatomicalType || '';
    }
}
