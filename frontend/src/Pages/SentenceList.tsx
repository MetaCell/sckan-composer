import React, { useEffect, useState } from "react";
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

const SentenceList = () => {
  const [sentenceList, setSentenceList] = useState<Sentence[]>();
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showSelectionBanner, setShowSelectionBanner] = useState(false)
  
  const [selectedRows, setSelectedRows] = useState<Sentence[]>([]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const queryOptions = useAppSelector((state) => state.sentence.queryOptions);

  const gutters = useGutters();
  const handleSelectAll = () => {
    // Implement the logic to select all sentences
    console.log("Select all sentences")
  }

  useEffect(() => {
    sentenceService.getList(queryOptions).then((res) => {
      setSentenceList(res.results);
      !res.count ? setTotalResults(0) : setTotalResults(res.count);
      setLoading(false);
    });
  }, [queryOptions]);
  
  useEffect(() => {
    setShowSelectionBanner(selectedRows.length === queryOptions.limit)
  }, [selectedRows, queryOptions.limit])
  
  
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
     
      <DataGridHeader entityType="sentence" queryOptions={queryOptions} selectedRows={selectedRows} />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <SelectionBanner
          totalResults={totalResults}
          show={showSelectionBanner}
          onSelectAll={handleSelectAll}
          entityType="sentences"
        />
      </Box>
      <EntityDataGrid
        entityList={sentenceList}
        entityType="sentence"
        loading={loading}
        totalResults={totalResults}
        allowSortByOwner={true}
        queryOptions={queryOptions}
        setSelectedRows={setSelectedRows}
      />
    </Box>
  );
};

export default SentenceList;
