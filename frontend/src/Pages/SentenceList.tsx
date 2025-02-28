import React, {useCallback, useEffect, useState} from "react";
import { useAppSelector } from "../redux/hooks";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";
import { useGutters } from "../styles/styles";
import Header from "../components/Header";
import { Sentence } from "../apiclient/backend";
import sentenceService from "../services/SentenceService";
import EntityDataGrid from "../components/EntityDataGrid";
import DataGridHeader from "../components/DataGridHeader";
import AddSentencesDialog from "../components/AddSentencesDialog";
import SelectionBanner from "../components/TableMultiSelectActions/SelectionBanner";
import { ENTITY_TYPES } from "../helpers/settings";

const SentenceList = () => {
  const [sentenceList, setSentenceList] = useState<Sentence[]>();
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showSelectionBanner, setShowSelectionBanner] = useState(false)
  const [isAllDataSelected, setIsAllDataSelected] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [manuallyDeselectedRows, setManuallyDeselectedRows] = useState<string[]>([]);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const queryOptions = useAppSelector((state) => state.sentence.queryOptions);

  const gutters = useGutters();
  
  const handleUndoSelectAll = () => {
    setSelectedRows([])
    setManuallyDeselectedRows([])
    setIsAllDataSelected(false)
    setShowSelectionBanner(false)
  }

  const refreshSentenceList = useCallback(() => {
    setLoading(true);
    sentenceService.getList(queryOptions).then((res) => {
      setSentenceList(res.results);
      !res.count ? setTotalResults(0) : setTotalResults(res.count);
      setLoading(false);
    });
  }, [queryOptions]);

  useEffect(() => {
    refreshSentenceList();
  }, [refreshSentenceList]);
  
  useEffect(() => {
    setShowSelectionBanner((selectedRows.length > 0 && selectedRows.length === queryOptions.limit) || (sentenceList !== undefined && selectedRows.length > sentenceList.length ));
  }, [selectedRows, queryOptions.limit, selectedRows.length, sentenceList])
  
  useEffect(() => {
    handleUndoSelectAll()
  }, [queryOptions.stateFilter, queryOptions.tagFilter])
  
  const selectedRowsCount = isAllDataSelected ? totalResults - manuallyDeselectedRows.length : selectedRows.length;
  
  return (
    <Box sx={gutters} p={6} justifyContent="center">
      <Header
        title="Sentences List"
        caption={`${totalResults} sentences in total`}
        actions={[
          {
            label: "Add a record",
            icon: AddIcon,
            handleClick: handleClickOpen,
          },
        ]}
      />
      <AddSentencesDialog open={open} handleClose={handleClose} />

      <DataGridHeader 
        entityType={ENTITY_TYPES.SENTENCE} 
        queryOptions={queryOptions} 
        selectedRows={selectedRows}
        refreshList={refreshSentenceList}
        isAllDataSelected={isAllDataSelected}
        selectedRowsCount={selectedRowsCount}
        manuallyDeselectedRows={manuallyDeselectedRows}
        setGridLoading={setLoading}
        isGridLoading={loading}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <SelectionBanner
          totalResults={totalResults}
          show={showSelectionBanner}
          entityType={ENTITY_TYPES.SENTENCE}
          setIsAllDataSelected={setIsAllDataSelected}
          isAllDataSelected={isAllDataSelected}
          handleUndoSelectAll={handleUndoSelectAll}
        />
      </Box>
      <EntityDataGrid
        entityList={sentenceList}
        entityType={ENTITY_TYPES.SENTENCE}
        loading={loading}
        totalResults={totalResults}
        allowSortByOwner={true}
        queryOptions={queryOptions}
        setSelectedRows={setSelectedRows}
        selectedRows={selectedRows}
        isAllDataSelected={isAllDataSelected}
        setManuallyDeselectedRows={setManuallyDeselectedRows}
        manuallyDeselectedRows={manuallyDeselectedRows}
      />
    </Box>
  );
};

export default SentenceList;
