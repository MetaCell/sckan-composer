import React  from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {Box} from "@mui/material";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

const StatementWithDois = ({ statement, background = "#fff" } : any) => {

  const onClickDoi = (uri: string) => {
    window.open(uri, '_blank')
  }

  return (
    <Box sx={{
      borderRadius: '12px',
      border: '1px solid #EAECF0',
      textAlign: 'left',
      backgroundColor: background,
      width: '100%',

      "& .MuiTypography-root": {
        padding: '12px'
      }
    }}>
      <Typography>{statement?.knowledge_statement}</Typography>
      { statement?.dois.length > 0 &&
       <>
        <Divider sx={{borderColor: '#EAECF0'}} />
        <Box sx={{padding: '12px', border: 0}}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1}
            alignItems='center'
          >
            {
              statement?.dois?.map((doi:any) => <Chip
                key={doi.id}
                variant="outlined"
                label={doi?.doi}
                sx={{borderRadius: '6px', border: '1px solid #D0D5DD'}}
                onClick={() => onClickDoi(doi?.doi_uri)}
              />)
            }
          </Stack>
        </Box>
      </>
      }
    </Box>
  );
};

export default StatementWithDois;
