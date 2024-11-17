import React, { useState } from "react";
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

const StatementAlertsAccordion = (props: any) => {
  const { statement, refreshStatement, isDisabled, setStatement } = props;
  
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTypes, setActiveTypes] = useState<number[]>([]);
  
  const alertTypes = [
    { id: 1, label: "Alert Type 1" },
    { id: 2, label: "Alert Type 2" },
    { id: 3, label: "Alert Type 3" },
  ];
  
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
            {alertTypes.map((type) => (
              <Chip
                key={type.id}
                label={activeTypes.includes(type.id) ? type.label : `+ ${type.label}`}
                clickable
                color={activeTypes.includes(type.id) ? "primary" : "default"}
                onClick={() => handleChipClick(type.id)}
                disabled={isDisabled}
              />
            ))}
            {statement.statement_alerts?.map((alert: any, index: number) => {
              return (
                <Box key={index} sx={{ marginBottom: 2 }}>
                  <StatementForm
                    statement={{ ...statement, statement_alerts: [alert] }}
                    uiFields={["statement_alerts"]}
                    format="small"
                    action={refreshStatement}
                    enableAutoSave={true}
                    isDisabled={isDisabled}
                  />
                </Box>
              );
            })}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
};

export default StatementAlertsAccordion;
