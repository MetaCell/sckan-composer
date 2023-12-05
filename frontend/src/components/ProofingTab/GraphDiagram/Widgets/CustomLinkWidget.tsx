import * as React from "react";
import {MetaLinkModel} from "@metacell/meta-diagram";

export interface CustomLinkWidgetProps {
    model: MetaLinkModel;
    path: SVGPathElement;
    selected: boolean;
}

export class CustomLinkWidget extends React.Component<CustomLinkWidgetProps> {
    render() {
        const pathData = this.props.path instanceof SVGPathElement ?
            this.props.path.getAttribute('d') || undefined :
            this.props.path;
        return (
            <>
                <path
                    fill="none"
                    strokeWidth={this.props.model.getOptions().width}
                    stroke="rgba(255,0,0,0.5)"
                    d={pathData}
                />
            </>
        );
    }
}

// @ts-ignore
export default CustomLinkWidget;
