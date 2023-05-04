import { GridRenderCellParams } from "@mui/x-data-grid"
import Typography from "@mui/material/Typography"
import Box from "@mui/material/Box"
import Grid from "@mui/material/Grid"
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined"
import { vars } from "../../theme/variables"
import Tag from "../Widgets/Tag"
import {SentenceStateChip, StatementStateChip} from "../Widgets/StateChip"
import { Tooltip } from "@mui/material"

export const renderPMID = (params: GridRenderCellParams) => (
  <Typography variant="subtitle1" color={vars.darkTextColor}>
    {params.value}
  </Typography>
);

export const renderTitle = (params: GridRenderCellParams) => (  
  <Tooltip title={params.value}>
    <Typography
      variant="body1"
      sx={{
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {params.value}
    </Typography>
  </Tooltip>
)

export const renderDate = (params: GridRenderCellParams) => {
  const date = new Date(params.value).toLocaleString("en-UK", {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = new Date(params.value).toLocaleString("en-UK", {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });

  return (
    <Box maxWidth="100%">
      <Typography color={vars.darkTextColor} noWrap>
        {date}
      </Typography>
      <Typography>{time}</Typography>
    </Box>
  );
};

export const renderNote = (params: GridRenderCellParams) => {
  if (params.value)
    return (
      <Box
        sx={{
          background: vars.bodyBgColor,
          borderRadius: 16,
          padding: "5px",
        }}
      >
        <ChatBubbleOutlineOutlinedIcon
          sx={{ display: "block" }}
          fontSize="inherit"
        />
      </Box>
    );
  return <></>;
};

export const renderTag = (params: GridRenderCellParams) => {
  return (
    <Grid container spacing={0.5}>
      {params.value.map((t: string) => (
        <Grid item key={t} maxWidth="100%">
          <Tag key={t} label={t} />
        </Grid>
      ))}
    </Grid>
  );
};

export const renderSentenceState = (params: GridRenderCellParams) => {
  return <SentenceStateChip value={params.value} />
}

export const renderStatementState = (params: GridRenderCellParams) => {
  return <StatementStateChip value={params.value} />
}
