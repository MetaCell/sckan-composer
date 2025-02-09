import React, { useCallback, useEffect, useState } from "react";
import Box from "@mui/material/Box";
import { BaseConnectivityStatement, ConnectivityStatement } from "../apiclient/backend";
import { useAppSelector } from "../redux/hooks";
import connectivityStatementService from "../services/StatementService";
import EntityDataGrid from "../components/EntityDataGrid";
import DataGridHeader from "../components/DataGridHeader";
import Header from "../components/Header";
import { useGutters } from "../styles/styles";
import { Typography } from "@mui/material";
import SelectionBanner from "../components/TableMultiSelectActions/SelectionBanner";
import { ENTITY_TYPES } from "../helpers/settings";

const StatementList = () => {
  const [statementList, setStatementList] = useState<BaseConnectivityStatement[]>();
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showSelectionBanner, setShowSelectionBanner] = useState(false)
  const [selectedRows, setSelectedRows] = useState<ConnectivityStatement[]>([]);
  const queryOptions = useAppSelector((state) => state.statement.queryOptions);

  const gutters = useGutters();

  const refreshStatementList = useCallback(() => {
    setLoading(true);
    connectivityStatementService.getList(queryOptions).then((res) => {
      setStatementList(res.results);
      setTotalResults(res.count ?? 0);
      setLoading(false);
    });
  }, [queryOptions]);

  useEffect(() => {
    setShowSelectionBanner(selectedRows.length === queryOptions.limit)
  }, [selectedRows, queryOptions.limit])

  useEffect(() => {
    setSelectedRows([])
  }, [queryOptions.stateFilter, queryOptions.tagFilter])

  useEffect(() => {
    // Initial fetch
    refreshStatementList();
  }, [refreshStatementList]);

  return (
    <Box sx={gutters} p={6} justifyContent="center">
      <Typography variant="subtitle1" sx={{ pb: 1.5 }}>
        Statements List
      </Typography>
      <Header
        title="Knowledge Statements List"
        caption={`${totalResults} statements in total`}
      />
      <DataGridHeader
        entityType={ENTITY_TYPES.STATEMENT} 
        queryOptions={queryOptions} 
        selectedRows={selectedRows} 
        refreshList={refreshStatementList}
        />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <SelectionBanner
          totalResults={totalResults}
          show={showSelectionBanner}
          entityType={ENTITY_TYPES.STATEMENT}
        />
      </Box>
      <EntityDataGrid
        entityList={statementList}
        entityType={ENTITY_TYPES.STATEMENT}
        loading={loading}
        totalResults={totalResults}
        queryOptions={queryOptions}
        allowSortByOwner={true}
        setSelectedRows={setSelectedRows}
        selectedRows={selectedRows}
      />
    </Box>
  );
};

export default StatementList;
