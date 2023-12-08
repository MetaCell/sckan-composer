import { NodeModel, DefaultPortModel } from '@projectstorm/react-diagrams';
import {NodeTypes} from "../GraphDiagram";

export class CustomNodeModel extends NodeModel {
    customType: NodeTypes;
    name: string;
    constructor(type: NodeTypes, name: string, color = 'rgb(0,192,255)') {
        super({
            type: 'custom',
        });
        this.customType = type;
        this.name = name;

        if (type === NodeTypes.Origin || type === NodeTypes.Via) {
            this.addPort(new DefaultPortModel(false, 'out', 'Out'));
        }
        if (type === NodeTypes.Via || type === NodeTypes.Destination) {
            this.addPort(new DefaultPortModel(true, 'in', 'In'));
        }
    }

    getCustomType() {
        return this.customType;
    }
}
