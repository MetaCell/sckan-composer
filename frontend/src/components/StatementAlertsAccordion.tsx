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
  const [openFormIndex, setOpenFormIndex] = useState<number | null>(null);
  
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
  
  const toggleFormVisibility = (index: number) => {
    setOpenFormIndex(openFormIndex === index ? null : index);
  };
  
  
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
            <Stack spacing="2rem">
              {statement.statement_alerts?.map((alert: any, index: number) => (
                <Box
                  key={index}
                  sx={{
                    borderRadius: "12px",
                    border: "1px solid #EAECF0",
                    backgroundColor: "#F2F4F7",
                    textAlign: "left",
                    width: "100%",
                    padding: "0.5rem",
                  }}
                >
                  <Accordion
                    expanded={openFormIndex === index}
                    onChange={() => toggleFormVisibility(index)}
                    elevation={0}
                    sx={{
                      '&.MuiPaper-root': {
                        backgroundColor: 'transparent',
                      },
                      "&:before": {
                        display: "none",
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      aria-controls="panel1bh-content"
                      className="panel1bh-header"
                      sx={{ p: 0, display: "flex", flexDirection: "row-reverse", m: 0 }}
                    >
                      <Typography variant="subtitle1" ml={1}>
                        {alerts[index]?.name}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{
                      p: 0
                    }}>
                      <StatementForm
                        statement={{
                          ...statement,
                          statement_alerts: [alert],
                        }}
                        uiFields={["statement_alerts"]}
                        format="small"
                        action={refreshStatement}
                        enableAutoSave={true}
                        isDisabled={isDisabled}
                        className="ks alert-form"
                      />
                    </AccordionDetails>
                  </Accordion>
                  {openFormIndex !== index && (
                    <Box sx={{
                      borderRadius: ".5rem",
                      border: "1px solid #EAECF0",
                      backgroundColor: "#fff",
                      textAlign: "left",
                      width: "100%",
                      padding: '.75rem',
                      boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)'
                    }}>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                      >
                        {alert.text || "No details provided."}
                      </Typography>
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default StatementAlertsAccordion;
