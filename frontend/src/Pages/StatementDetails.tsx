import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import { useParams } from "react-router-dom";
import StatementForm from "../components/Forms/StatementForm";
import statementService from "../services/StatementService";
import NoteForm from "../components/Forms/NoteForm";
import TagForm from "../components/Forms/TagForm";
import { ConnectivityStatement } from "../apiclient/backend";
import { Button } from "@mui/material";
import { userProfile } from "../services/UserService";
import CheckDuplicates from "../components/CheckForDuplicates/CheckDuplicatesDialog";

const StatementDetails = () => {
  const { statementId } = useParams();
  const [statement, setStatement] = useState({} as ConnectivityStatement);
  const [loading, setLoading] = useState(true);

  const doTransition = (transition: string) => {
    statementService
      .doTransition(statement, transition)
      .then((statement: ConnectivityStatement) => {
        setStatement(statement);
      });
  };

  useEffect(() => {
    if (statementId) {
      statementService
        .getObject(statementId)
        .then((statement: ConnectivityStatement) => {
          setStatement(statement);

          if (
            statement.owner &&
            statement.owner?.id !== userProfile.getUser().id
          ) {
            if (
              window.confirm(
                `This statement is assigned to ${statement.owner.first_name}, assign to yourself?`
              )
            ) {
              statementService
                .save({ ...statement, owner_id: userProfile.getUser().id })
                .then((statement: ConnectivityStatement) => {
                  setStatement(statement);
                });
            }
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [statementId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Grid p={12} container justifyContent="center">
      <Grid item xl={12}>
        <Paper elevation={0} sx={{ padding: 8 }}>
          <Stack alignItems="center" spacing={4}>
            <Box textAlign="center">
              <Typography variant="h3" marginBottom={1.5}>
                Statement Details
              </Typography>
              <Typography variant="subtitle2">
                Show the statement with id {statementId} details here
              </Typography>
              <Typography variant="subtitle2">
                Sentence: {statement?.sentence.title}
              </Typography>
              <Typography variant="subtitle2">
                {statement?.sentence.text}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      </Grid>
      <Grid item xl={7}>
        <Typography>
          Last modified by {statement?.owner?.first_name} on{" "}
          {statement?.modified_date}
        </Typography>
        {statement?.available_transitions.map((transition) => (
          <Button onClick={() => doTransition(transition)}>{transition}</Button>
        ))}
        <CheckDuplicates />
        <StatementForm data={statement} format="full" setter={setStatement} />
      </Grid>
      <Grid item xl={5}>
        <TagForm
          data={statement.tags}
          extraData={{ parentId: statement.id, service: statementService }}
          setter={setStatement}
        />
      </Grid>
      <Grid item xl={5}>
        <NoteForm extraData={{ connectivity_statement_id: statement.id }} />
      </Grid>
    </Grid>
  );
};

export default StatementDetails;
