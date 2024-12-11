import React, { useEffect, useRef, useState } from "react";
import InfoMenu from "./InfoMenu";
import NavigationMenu from "./NavigationMenu";
import createEngine, {
  BasePositionModelOptions,
  DiagramModel,
  DefaultLinkModel,
} from "@projectstorm/react-diagrams";
import { CanvasWidget } from "@projectstorm/react-canvas-core";
import { CustomNodeFactory } from "./Factories/CustomNodeFactory";
import {
  AnatomicalEntity,
  ConnectivityStatement,
  DestinationSerializerDetails,
  ViaSerializerDetails,
} from "../../../apiclient/backend";
import { useParams } from "react-router-dom";
import { processData } from "../../../services/GraphDiagramService";

import dagre from "dagre";
import { CustomNodeModel } from "./Models/CustomNodeModel";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/system";
import { useDispatch, useSelector } from "react-redux";
import {
  setIsResetInvoked,
  setPositionChangeOnly,
  setWasChangeDetected,
} from "../../../redux/statementSlice";
import { RootState } from "../../../redux/store";

export enum NodeTypes {
  Origin = "Origin",
  Via = "Via",
  Destination = "Destination",
}

export interface CustomNodeOptions extends BasePositionModelOptions {
  forward_connection: any[];
  to?: Array<{ name: string; type: string }>;
  from?: Array<{ name: string; type: string }>;
  anatomicalType?: string;
}

interface GraphDiagramProps {
  origins: AnatomicalEntity[] | undefined;
  vias: ViaSerializerDetails[] | undefined;
  destinations: DestinationSerializerDetails[] | undefined;
  forwardConnection?: any[] | undefined;
  serializedGraph?: any | undefined;
  statement: ConnectivityStatement;
  setStatement: (statement: any) => void;
  isDisabled?: boolean;
}

const GraphDiagram: React.FC<GraphDiagramProps> = ({
  origins,
  vias,
  destinations,
  forwardConnection = [],
  serializedGraph,
  statement,
  setStatement,
  isDisabled = false,
}) => {
  const theme = useTheme();
  const { statementId } = useParams();
  const dispatch = useDispatch();

  const [engine] = useState(() => createEngine());
  const [modelUpdated, setModelUpdated] = useState(false);
  const [modelFitted, setModelFitted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rankdir, setRankdir] = useState<string>("TB");
  const [isGraphLocked, setIsGraphLocked] = React.useState(true);
  const [ignoreSerializedGraph, setIgnoreSerializedGraph] = useState(false);
  const { wasChangeDetected, isResetInvoked } = useSelector(
    (state: RootState) => state.statement
  );
  let g = new dagre.graphlib.Graph();

  const layoutNodes = (nodes: CustomNodeModel[], links: DefaultLinkModel[]) => {
    g = new dagre.graphlib.Graph();

    g.setGraph({
      rankdir: rankdir,
      ranksep: rankdir === "TB" ? 150 : 100,
      marginx: rankdir === "TB" ? 150 : 100,
      marginy: rankdir === "TB" ? 100 : 150,
      edgesep: 50,
      nodesep: 150,
    });

    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach((node) => {
      node.setPosition(0, 0);
      g.setNode(node.getID(), { width: 100, height: 50 });
    });

    links.forEach((link) => {
      g.setEdge(
        link.getSourcePort().getNode().getID(),
        link.getTargetPort().getNode().getID()
      );
    });

    dagre.layout(g);

    g.nodes().forEach((nodeId: string) => {
      const node = nodes.find((n) => n.getID() === nodeId);
      const { x, y } = g.node(nodeId);
      node?.setPosition(x, y);
    });

    const model = engine.getModel();
    if (model !== null && !model?.isLocked() === isGraphLocked) {
      model.setLocked(isGraphLocked);
    }
  };

  const toggleRankdir = () => {
    g = new dagre.graphlib.Graph();
    let newDir = rankdir === "TB" ? "LR" : "TB";
    const nodes = engine.getModel().getNodes();
    const links = engine.getModel().getLinks();
    const firstPos = nodes[0].getPosition();
    const lastPos = nodes[nodes.length - 1].getPosition();
    g.setGraph({
      rankdir: newDir,
      ranksep: newDir === "TB" ? 150 : 100,
      marginx: newDir === "TB" ? 150 : 100,
      marginy: newDir === "TB" ? 100 : 150,
      edgesep: 50,
      nodesep: 150,
    });
    g.setDefaultEdgeLabel(() => ({}));
    nodes.forEach((node) => {
      g.setNode(node.getID(), { width: 100, height: 50 });
    });

    links.forEach((link) => {
      g.setEdge(
        link.getSourcePort().getNode().getID(),
        link.getTargetPort().getNode().getID()
      );
    });

    dagre.layout(g);

    const newFirst = g.node(nodes[0].getID());
    const newLast = g.node(nodes[nodes.length - 1].getID());

    if (
      firstPos.x === newFirst.x &&
      firstPos.y === newFirst.y &&
      lastPos.x === newLast.x &&
      lastPos.y === newLast.y
    ) {
      newDir = newDir === "TB" ? "LR" : "TB";
    }

    setRankdir(newDir);
    resetGraph();
  };

  const switchLockedGraph = (lock: boolean) => {
    const model = engine.getModel();
    if (model !== null && lock === !model.isLocked()) {
      model.setLocked(lock);
    }
    setIsGraphLocked(lock);
  };

  const initializeGraph = (ignoreGraphSerialised = false) => {
    const model = new DiagramModel();

    // Process data to revert to the initial layout
    const { nodes, links } = processData({
      origins: origins ? origins : [],
      vias: vias ? vias : [],
      destinations,
      forwardConnection,
      serializedGraph,
    });

    // If the backend does NOT provides us a serialised graph then we use the smart routing.
    if (ignoreGraphSerialised ||ignoreSerializedGraph || serializedGraph === undefined) {
      layoutNodes(nodes, links);
    }

    nodes.forEach((node) => {
      node.registerListener({
        positionChanged: () => {
          dispatch(setPositionChangeOnly(true));
        },
      });
    });
    model.addAll(...nodes, ...links);
    engine.setModel(model);
    setModelUpdated(true);
    setModelFitted(false);
  };

  const resetGraph = () => {
    setIgnoreSerializedGraph(true);
    initializeGraph(true);
    dispatch(setIsResetInvoked(true));
    dispatch(setPositionChangeOnly(false));
    dispatch(setWasChangeDetected(false));
  };

  // This effect runs once to set up the engine
  useEffect(() => {
    engine.getNodeFactories().registerFactory(new CustomNodeFactory());
  }, [engine]);

  // This effect runs whenever origins, vias, or destinations change
  useEffect(() => {
    initializeGraph(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rankdir]);

  useEffect(() => {
    if (wasChangeDetected || isResetInvoked) {
      setIsGraphLocked(false);
    } else {
      setIsGraphLocked(true);
    }
  }, [wasChangeDetected, isResetInvoked]);

  // This effect prevents the default scroll and touchmove behavior
  useEffect(() => {
    const currentContainer = containerRef.current;

    if (modelUpdated && currentContainer) {
      const disableScroll = (event: Event) => {
        event.stopPropagation();
      };

      currentContainer.addEventListener("wheel", disableScroll, {
        passive: false,
      });
      currentContainer.addEventListener("touchmove", disableScroll, {
        passive: false,
      });

      return () => {
        currentContainer?.removeEventListener("wheel", disableScroll);
        currentContainer?.removeEventListener("touchmove", disableScroll);
      };
    }
  }, [modelUpdated]);

  useEffect(() => {
    if (modelUpdated && !modelFitted) {
      // TODO: for unknown reason at the moment if I call zoomToFit too early breaks the graph
      // To fix later in the next contract.
      setTimeout(() => {
        engine.zoomToFit();
      }, 1000);
      setModelFitted(true);
    }
  }, [modelUpdated, modelFitted, engine]);

  useEffect(() => {
    const model = engine.getModel();
    if (!model) return;
    model.getNodes().forEach((node) => {
      node.setLocked(isGraphLocked);
    });
  }, [isGraphLocked, engine]);

  useEffect(() => {
    return () => setIgnoreSerializedGraph(false); // Reset the flag on unmount
  }, []);

  return (
    <Box id='graph-container'>
      <NavigationMenu
        engine={engine}
        statementId={statementId || "-1"}
        rankdir={rankdir}
        toggleRankdir={toggleRankdir}
        resetGraph={resetGraph}
        isGraphLocked={isGraphLocked}
        switchLockedGraph={switchLockedGraph}
        statement={statement}
        setStatement={setStatement}
        isDisabled={isDisabled}
      />
      <Box
        display="flex"
        justifyContent="center"
        sx={{ background: theme.palette.grey[100], borderRadius: 1 }}
      >
        <Box sx={{ height: "800px", width: "100%" }}>
          {modelUpdated ? (
            <div ref={containerRef} className={"graphContainer"}>
              <CanvasWidget className={"graphContainer"} engine={engine} />
            </div>
          ) : null}
        </Box>
      </Box>
      <InfoMenu engine={engine} forwardConnection={true} />
    </Box>
  );
};

export default GraphDiagram;
