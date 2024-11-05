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
import { useSectionStyle } from "../../styles/styles";
import { useTheme } from "@mui/system";

const linkedChip = (data: any) => {

 
  if (data.id === undefined || data.id === null) {
    return null
  }

  const handleOpenId = (e: any) => {
    window.open(data?.uri, '_blank')
  }

  return (
    <Chip
      label={`${data.label}:${data.id}`}
      variant="filled"
      deleteIcon={<OpenInNewIcon />}
      onDelete={() => handleOpenId(data.uri)}
      sx={{
        background: vars.lightBlue,
        color: vars.darkBlue,
        marginLeft: '10px',
        marginRight: '10px',

        "& .MuiChip-deleteIcon": {
          fontSize: '14px',
          color: vars.mediumBlue
        }
      }}
    />
  )
}

const SentenceForm = (props: any) => {
  const { format, data, isDisabled } = props
  const { schema, uiSchema } = jsonSchemas.getSentenceSchema()
  const theme = useTheme()
  const sectionStyle = useSectionStyle(theme)

  const uiFields = format === 'small'
    ? ["title"]
    : undefined

  const customUiSchema: UiSchema = {
    ...uiSchema,
    title: {
      "ui:widget": CustomTextField,
      "ui:options": {
        isDisabled,
        label: 'Article Title',
        placeholder: "Enter Article Title",
      }
    },
  };

  const customSchema = {
    ...schema,
    "title": ""
  }
  console.log(data)
  return (
    <Paper sx={sectionStyle}>
      <Box mb={3}>
        <Typography variant='h5' color={vars.darkTextColor}>
          NLP Sentence
        </Typography>
      </Box>
      <Box>
        <Typography variant='subtitle1' color={vars.darkTextColor} sx={{ whiteSpace: "pre-wrap"}}>
          {data?.text}
        </Typography>
      </Box>
      <FormBase
        service={sentenceService}
        schema={customSchema}
        uiSchema={customUiSchema}
        uiFields={uiFields}
        enableAutoSave={false}
        children={true}
        submitOnBlurFields={['title']}
        disabled={isDisabled}
        {...props}
      />
      <Box mt={2}>
        {
          linkedChip({id: data?.pmid, uri: data?.pmid_uri, label: "PMID"})
        }
        {
          linkedChip({id: data?.pmcid, uri: data?.pmcid_uri, label: "PMCID"})
        }
        {
          linkedChip({id: data?.doi, uri: data?.doi_uri, label: "DOI"})
        }
      </Box>
    </Paper>
  )
}

export default SentenceForm
