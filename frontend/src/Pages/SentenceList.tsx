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

const SentenceList = () => {
  const [sentenceList, setSentenceList] = useState<Sentence[]>();
  const [totalResults, setTotalResults] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const queryOptions = useAppSelector((state) => state.sentence.queryOptions);

  const gutters = useGutters();

  useEffect(() => {
    sentenceService.getList(queryOptions).then((res) => {
      setSentenceList(res.results);
      !res.count ? setTotalResults(0) : setTotalResults(res.count);
      setLoading(false);
    });
  }, [queryOptions]);

  return (
    <Box sx={gutters} p={6} justifyContent="center">
      <Header
        title="Sentences List"
        caption={`${totalResults} sentences in total`}
        actions={[{ label: "Add a record", icon: AddIcon }]}
      />
      <DataGridHeader entityType="sentence" queryOptions={queryOptions} />
      <EntityDataGrid
        entityList={sentenceList}
        entityType="sentence"
        loading={loading}
        totalResults={totalResults}
        queryOptions={queryOptions}
      />
    </Box>
  );
};

export default SentenceList;
