import * as React from "react";
import { MetaLinkModel } from "@metacell/meta-diagram";

export interface CustomLinkWidgetProps {
  model: MetaLinkModel;
  path: SVGPathElement;
  selected: boolean;
}

export class CustomLinkWidget extends React.Component<CustomLinkWidgetProps> {
  render() {
    const pathData =
      this.props.path instanceof SVGPathElement
        ? this.props.path.getAttribute("d") || undefined
        : this.props.path;
    return (
      <>
        <path
          fill="none"
          strokeWidth="1.5px"
          stroke="rgba(14, 147, 132, 1), rgba(3, 152, 85, 1)"
          d={pathData}
        />
      </>
    );
  }
}

// @ts-ignore
export default CustomLinkWidget;
