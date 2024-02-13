import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { BaseConnectivityStatement } from "../apiclient/backend";
import { useAppSelector } from "../redux/hooks";
import connectivityStatementService from "../services/StatementService";
import EntityDataGrid from "../components/EntityDataGrid";
import DataGridHeader from "../components/DataGridHeader";
import Header from "../components/Header";
import { useGutters } from "../styles/styles";
import { Typography } from "@mui/material";

const StatementList = () => {
  const [statementList, setStatementList] = useState<BaseConnectivityStatement[]>();
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const queryOptions = useAppSelector((state) => state.statement.queryOptions);

  const gutters = useGutters();

  useEffect(() => {
    connectivityStatementService.getList(queryOptions).then((res) => {
      setStatementList(res.results);
      !res.count ? setTotalResults(0) : setTotalResults(res.count);
      setLoading(false);
    });
  }, [queryOptions]);

  return (
    <Box sx={gutters} p={6} justifyContent="center">
      <Typography variant="subtitle1" sx={{ pb: 1.5 }}>
        Statements List
      </Typography>
      <Header
        title="Knowledge Statements List"
        caption={`${totalResults} statements in total`}
      />
      <DataGridHeader entityType="statement" queryOptions={queryOptions} />
      <EntityDataGrid
        entityList={statementList}
        entityType="statement"
        loading={loading}
        totalResults={totalResults}
        queryOptions={queryOptions}
      />
    </Box>
  );
};

export default StatementList;
