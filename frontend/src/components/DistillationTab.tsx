import React, { useEffect, useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import statementService from "../services/StatementService";
import SentenceForm from "../components/Forms/SentenceForm";
import SpeciesForm from "../components/Forms/SpeciesForm";
import StatementForm from "../components/Forms/StatementForm";
import Paper from "@mui/material/Paper";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import {Box} from "@mui/material";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

const DistillationTab = ({ statement, setStatement } : any) => {

  return (
    <Grid container mb={2} spacing={2}>
      <Grid item xs={12}>
        <Paper>
          <Typography variant="h5" mb={3}>
            Knowledge Statements
          </Typography>
          <Box sx={{
            background: '#F2F4F7',
            borderRadius: '12px',
            padding: '8px !important',
            textAlign: 'center',

            "& .MuiBox-root": {
              background: '#fff',
              borderRadius: '12px',
              border: '1px solid #EAECF0',
              textAlign: 'left'
            },

            "& .MuiTypography-root": {
              padding: '12px'
            }
          }}>
              <Box>
                <Typography>Superior cervical ganglion to sphincter papillae via internal carotid nerve plexus via ophthalmic plexus via long ciliary nerve</Typography>
                <Divider sx={{borderColor: '#EAECF0'}} />
                <Typography>
                  <Chip
                    variant="outlined"
                    label='https://loremipsum.com/paper'
                    sx={{borderRadius: '6px', border: '1px solid #D0D5DD'}}
                  />
                </Typography>
              </Box>
          </Box>
          <Divider sx={{margin: '24px 0'}}>Records from the same NLP Sentence</Divider>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 2 }}
            alignItems='center'
          >
            <Box sx={{
              borderRadius: '12px',
              border: '1px solid #EAECF0',
              textAlign: 'left',
              background: '#F9FAFB',

              "& .MuiTypography-root": {
                padding: '12px',
              }
            }}>
              <Typography>Superior cervical ganglion to sphincter papillae via internal carotid nerve plexus via ophthalmic plexus via long ciliary nerve</Typography>
              <Divider sx={{borderColor: '#EAECF0'}} />
              <Typography>
                <Chip
                  variant="outlined"
                  label='https://loremipsum.com/paper'
                  sx={{borderRadius: '6px', border: '1px solid #D0D5DD', background: '#fff'}}
                />
              </Typography>
            </Box>
            <Box>
              <OpenInNewIcon sx={{
                color: '#98A2B3',
                fontSize: '12px'
              }} />
            </Box>
          </Stack>

        </Paper>
      </Grid>

      <Grid item xs={12}>
        <SentenceForm
          data={statement.sentence}
          format="small"
        />
      </Grid>

      <Grid item xs={12}>
        <Paper>
          <Typography variant="h5" mb={1}>
            Statements Details
          </Typography>
          <SpeciesForm
            data={statement.species}
            extraData={{ parentId: statement.id, service: statementService }}
            setter={setStatement}
          />
          <StatementForm
            statement={statement}
            format="small"
            setter={setStatement}
            extraData={{
              statement_id: statement.id,
              knowledge_statement: statement.knowledge_statement,
            }}
            uiFields={[
              "biological_sex_id",
              "apinatomy_model",
              "circuit_type",
              "laterality",
              "ans_division_id",
              "destination_id",
              "origin_id"
            ]}
          />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default DistillationTab;
