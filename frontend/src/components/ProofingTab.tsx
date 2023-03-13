import React from "react";
import { ConnectivityStatement } from "../apiclient/backend/api";
import StatementChart from "./StatementChart";

const ProofingTab = (props: { statement: ConnectivityStatement }) => {
  const { statement } = props;
  return <StatementChart statement={statement} />;
};

export default ProofingTab;
