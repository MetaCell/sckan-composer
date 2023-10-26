import React from 'react';
import { Stack, Typography, Box } from '@mui/material';

const DefaultBody = ({ entity }: any) => (
<Stack spacing={2} flexGrow={1}>
  {entity?.content?.map((detail: any, i: number) => <Stack spacing={1} sx={{ mt: i !== 0 ? 3 : 0 }}>
    <Typography variant="body1">
      {detail?.title}
    </Typography>
    <Typography variant="body2">{detail?.value}</Typography>
  </Stack>)}
</Stack>
);

const HoveredOptionContent = ({
  entity,
  HeaderComponent,
  BodyComponent,
  FooterComponent
}: any) => {
  return (
    <Box
      width={1}
      p={3}
      display='flex'
      flexDirection='column'
      minHeight={1}
      sx={{
        '& .MuiTypography-body1': {
          color: "#A9ACB2",
          fontSize: "0.75rem",
          fontWeight: 500,
          lineHeight: "1.125rem",
        },

        '& .MuiTypography-body2': {
          color: "#373A3E",
          fontSize: "0.875rem",
          fontWeight: 400,
          lineHeight: "1.25rem",
          marginTop: '0.25rem',
        },

        '& .MuiChip-root': {
          color: "#344054",
          fontSize: "0.875rem",
          fontWeight: 500,
          lineHeight: "1.25rem",
          borderRadius: '0.375rem',
          borderColor: '#D0D5DD',
          padding: '0.125rem 0',
          '&.MuiChip-filledSuccess': {
            background: '#ECFDF3',
            borderRadius: '1rem',
            color: '#027A48'
          },
          '&.MuiChip-filledError': {
            background: '#FEF3F2',
            borderRadius: '1rem',
            color: '#B42318',
          },
          '& .MuiChip-label': {
            p: '0 0.5625rem',
          }
        }
      }}
    >
      {HeaderComponent && <HeaderComponent entity={entity} />}
      {BodyComponent ? <BodyComponent entity={entity} /> : <DefaultBody entity={entity} />}
      {FooterComponent && <FooterComponent entity={entity} />}
    </Box>
  );
};

export default HoveredOptionContent;

