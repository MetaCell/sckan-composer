import React, {useEffect, useState} from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Box,
  Chip,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatementForm from "../components/Forms/StatementForm";
import connectivityStatementService from "../services/StatementService";
import Stack from "@mui/material/Stack";

const StatementAlertsAccordion = (props: any) => {
  const { statement, refreshStatement, isDisabled, setStatement } = props;
  
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTypes, setActiveTypes] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };
  
  const handleChipClick = async (typeId: number) => {
    if (!activeTypes.includes(typeId)) {
      setActiveTypes([...activeTypes, typeId]);
      
      const updatedAlerts = [
        ...(statement.statement_alerts || []),
        { alert_type: typeId, text: "" },
      ];
      
      const updatedStatement = { ...statement, statement_alerts: updatedAlerts };
      setStatement(updatedStatement);
    }
  };
  
  useEffect(() => {
    connectivityStatementService.getAlertsList().then((res) => {
      setAlerts(res.results)
    });
  }, []);
  
  useEffect(() => {
    setActiveTypes(statement.statement_alerts.map((row: any) => row.alert_type))
  }, [statement]);
  
  return (
    <Box px={2} py={0.5}>
      <Accordion
        expanded={expanded}
        onChange={handleChange}
        elevation={0}
        sx={{
          "&:before": {
            display: "none",
          },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          className="panel1bh-header"
          sx={{ p: 0, display: "flex", flexDirection: "row-reverse" }}
        >
          <Typography variant="h6" ml={1}>
            Statement Alerts
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ px: 4, pt: 0, pb: 2 }}>
          <Box>
            {alerts.map((type) => (
              <Chip
                key={type.id}
                label={activeTypes.includes(type.id) ? type.name : `+ ${type.name}`}
                clickable
                color={activeTypes.includes(type.id) ? "primary" : "default"}
                onClick={() => handleChipClick(type.id)}
                disabled={isDisabled}
              />
            ))}
            <Stack spacing='2rem'>
              {statement.statement_alerts?.map((alert: any, index: number) => {
                return (
                  <Box
                    sx={{
                      borderRadius: '12px',
                      border: '1px solid #EAECF0',
                      textAlign: 'left',
                      backgroundColor: '#F2F4F7',
                      width: '100%',
                      padding: '.5rem',
                      
                      '& .MuiInputBase-root': {
                        p: '0 .75rem',
                        mt: '-1rem',
                        '& .MuiOutlinedInput-notchedOutline': {
                          boxShadow: 'none !important',
                          border: 'none !important',
                        },
                      }
                    }}
                  >
                    <Typography variant="subtitle1" mb={'.5rem'}>
                      {alerts[index]?.name}
                    </Typography>
                    <StatementForm
                      statement={{ ...statement, statement_alerts: [alert] }}
                      uiFields={["statement_alerts"]}
                      format="small"
                      action={refreshStatement}
                      enableAutoSave={true}
                      isDisabled={isDisabled}
                      className='ks alert-form'
                    />
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default StatementAlertsAccordion;
