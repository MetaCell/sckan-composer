import React, {useEffect, useRef, useState} from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatementForm from "../components/Forms/StatementForm";
import connectivityStatementService from "../services/StatementService";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import {DeleteOutlined} from "@mui/icons-material";
import statementService from "../services/StatementService";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Button from "@mui/material/Button";
const StatementAlertsAccordion = (props: any) => {
  const { statement, refreshStatement, isDisabled, setStatement } = props;
  
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTypes, setActiveTypes] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [openFormIndex, setOpenFormIndex] = useState<number | null>(null);
  const textInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };
  
  
  const addAlert = (typeId: number) => {
    if (!activeTypes.includes(typeId)) {
      const updatedAlerts = [
        ...(statement.statement_alerts || []),
        { alert_type: typeId, text: "" },
      ];
      
      const updatedStatement = { ...statement, statement_alerts: updatedAlerts };
      setActiveTypes([...activeTypes, typeId]);
      setStatement(updatedStatement);
      
      const newIndex = updatedAlerts.length - 1;
      setOpenFormIndex(newIndex);
      
      setTimeout(() => {
        const textArea = document.querySelectorAll(`#root_statement_alerts_0_text`);
        if (textArea) {
          (textArea[newIndex] as HTMLTextAreaElement).focus();
        }
      }, 0);
    }
  };
  
  const handleDelete = async (index: number) => {
    const updatedAlerts = statement.statement_alerts.filter(
      (_: any, alertIndex: number) => alertIndex !== index
    );
    
    const patchedStatement = {
      statement_alerts: updatedAlerts,
    };
    
    try {
      const response = await statementService.partialUpdate(
        statement.id,
        patchedStatement
      );
      setStatement(response);
    } catch (error) {
      alert(`Error deleting alert: ${error}`);
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
            <Select
              value=""
              displayEmpty
              fullWidth
              sx={{ mb: 2 }}
              renderValue={() => "Select an Alert"}
            >
              {alerts.map((type: any) => (
                <MenuItem
                  key={type.id}
                  value={type.id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography>{type.name}</Typography>
                  {!activeTypes.includes(type.id) && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => addAlert(type.id)}
                      disabled={isDisabled}
                    >
                      Add
                    </Button>
                  )}
                </MenuItem>
              ))}
            </Select>
            <Stack spacing="2rem">
              {statement.statement_alerts?.map((alert: any, index: number) => (
                <Box
                  key={alert.alert_type}
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
                      p: 0,
                      display: "flex",
                      gap: ".5rem",
                      alignItems: 'center',
                      '& .MuiInputBase-root': {
                        backgroundColor: "#fff",
                      },
                      '& .MuiGrid-root': {
                        marginTop: '0 !important',
                        
                        '& .MuiGrid-root': {
                          marginBottom: '0 !important',
                          paddingTop: '0 !important',
                        }
                      }
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
                        className="alerts-form"
                        textInputRefs={textInputRefs}
                      />
                      <IconButton onClick={() => handleDelete(index)}>
                        <DeleteOutlined />
                      </IconButton>
                    </AccordionDetails>
                  </Accordion>
                  {openFormIndex !== index && (
                    <Box display='flex' alignItems='center' gap='.5rem'>
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
                          {alert.text}
                        </Typography>
                      </Box>
                      <IconButton disabled>
                        <DeleteOutlined />
                      </IconButton>
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
