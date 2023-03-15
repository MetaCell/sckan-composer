import React from 'react'
import { Box } from '@mui/material'
import { FormBase } from './FormBase'
import { jsonSchemas } from '../../services/JsonSchema'
import sentenceService from '../../services/SentenceService'
import {UiSchema} from "@rjsf/utils";
import CustomTextField from "../Widgets/CustomTextField";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import {vars} from "../../theme/variables";
import Chip from "@mui/material/Chip";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const SentenceForm = (props: any) => {
  const { format, data } = props
  const { schema, uiSchema } = jsonSchemas.getSentenceSchema()

  const uiFields = format === 'small'
    ? ["title"]
    : undefined

  const uiOrder = format === "create" ? ["*", "text"] : undefined;
  // TODO: set up the widgets for the schema

  const handleOpenPmid = () => {
    console.log('pmid')
  }

  const customUiSchema: UiSchema = {
    ...uiSchema,
    title: {
      "ui:widget": CustomTextField,
      "ui:options": {
        label: 'Article Title',
        placeholder: "Enter Article Title",
      }
    },
  };

  const customSchema = {
    ...schema,
    "title": ""
  }

  return (
    <Paper sx={{padding: '24px 14px'}}>
      <Box pl={2} mb={3}>
        <Typography variant='h5' color={vars.darkTextColor}>
          NLP Sentence
        </Typography>
      </Box>
      <Box pl={2}>
        <Typography variant='subtitle1' color={vars.darkTextColor}>
          {data?.text}
        </Typography>
      </Box>
      <FormBase
        service={sentenceService}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={true}
        children={true}
        {...props}
      />
      <Box pl={2}>
        <Typography color={vars.labelColor} fontWeight={500} mb={1}>
          PMID (PubMed identifier)
        </Typography>
        {
          data?.pmid && <Chip
            label={data?.pmid}
            variant="filled"
            deleteIcon={<OpenInNewIcon />}
            onDelete={handleOpenPmid}
            sx={{
              background: vars.lightBlue,
              color: vars.darkBlue,

              "& .MuiChip-deleteIcon": {
                fontSize: '14px',
                color: vars.mediumBlue
              }
            }}
          />
        }
      </Box>
    </Paper>
  )
}

export default SentenceForm
