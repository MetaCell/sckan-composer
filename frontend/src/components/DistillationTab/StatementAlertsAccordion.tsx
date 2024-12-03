import React, {useEffect, useRef, useState} from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StatementForm from "../Forms/StatementForm";
import connectivityStatementService from "../../services/StatementService";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { DeleteOutlined} from "@mui/icons-material";
import statementService from "../../services/StatementService";
import Select from "@mui/material/Select";
import AlertMenuItem from "./AlertMenuItem";
import {vars} from "../../theme/variables";
import ConfirmationDialog from "./ConfiramtionDialog";
const StatementAlertsAccordion = (props: any) => {
  const { statement, refreshStatement, isDisabled, setStatement } = props;
  
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTypes, setActiveTypes] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [openFormIndex, setOpenFormIndex] = useState<number | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
  
  const currentAlertRef = useRef<any>(null);
  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };
  
  const addAlert = (typeId: number) => {
    if (!activeTypes.includes(typeId)) {
      const newAlert = { connectivity_statement: parseInt(statement.id), alert_type: typeId, text: "" }
      
      connectivityStatementService.createAlert(newAlert).then((res: any) => {
        currentAlertRef.current = res;
        
        const updatedAlerts = [
          ...(statement.statement_alerts || []),
          res,
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
        }, 500);
      })
    }
  };
  
  
  const confirmDelete = async () => {
    if (alertToDelete === null) return;
 
    try {
     await statementService.destroyAlert(alertToDelete).then(() => {
       refreshStatement();
     })
    } catch (error) {
      alert(`Error deleting alert: ${error}`);
    }
    
    setOpenFormIndex(null);
    setOpenDialog(false);
    setAlertToDelete(null);
  };
  const handleDelete = async (index: number) => {
    setAlertToDelete(index);
    setOpenDialog(true);
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
    const alert = statement.statement_alerts[index] || null;
    setOpenFormIndex(openFormIndex === index ? null : index);
    currentAlertRef.current = alert;
  };
  
  const onInputBlur = async (value: string) => {
    const alert = currentAlertRef.current;
    const updatedAlert = { ...alert, text: value };
   await connectivityStatementService.updateAlert(alert.id, updatedAlert).then(() => refreshStatement())
  }

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
          <Box sx={{
            display: "flex",
            flexDirection: "column",
            gap: '0.75rem'
          }}>
            <Select
              sx={{
                alignSelf: 'flex-end',
                fontWeight: 600,
                borderRadius: '6.25rem',
                border: `1px solid ${vars.buttonOutlinedBorderColor}`,
                boxShadow: '0px 1px 2px 0px rgba(16, 24, 40, 0.05)',
                minWidth: '10rem',
                padding: '0.625rem 1rem',
                
                  '& .MuiSelect-select': {
                    padding: 0
                  }
              }}
              value=""
              displayEmpty
              renderValue={() => "Display alerts"}
              MenuProps={{
                PaperProps: {
                  style: {
                    width: '19.25rem',
                    padding: 0,
                    boxShadow: '0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)'
                  },
                },
              }}
            >
              <Box>
                <Typography sx={{
                  padding: "0.875rem 0.875rem 0.5rem 0.875rem",
                  color: vars.inputPlaceholderColor,
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  AVAILABLE
                </Typography>
                {alerts
                  .filter((type: any) => !activeTypes.includes(type.id))
                  .map((type: any) => (
                    <AlertMenuItem
                      key={type.id}
                      type={type}
                      isSelected={false}
                      isDisabled={isDisabled}
                      onAdd={addAlert}
                      alertStatus={'available'}
                    />
                  ))}
              </Box>
              
              {/* DISPLAYED Alerts */}
              <Box>
                <Typography sx={{
                  padding: "0.875rem 0.875rem 0.5rem 0.875rem",
                  color: vars.inputPlaceholderColor,
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  DISPLAYED
                </Typography>
                {alerts
                  .filter((type: any) => activeTypes.includes(type.id))
                  .map((type: any) => (
                    <AlertMenuItem
                      key={type.id}
                      type={type}
                      isSelected={true}
                      isDisabled={isDisabled}
                      onAdd={addAlert}
                      alertStatus={'displayed'}
                    />
                  ))}
              </Box>
            </Select>
            <Stack spacing="2rem" pt='.75rem' pb='.75rem'>
              {statement.statement_alerts?.map((alert: any, index: number) => (
                <Box
                  key={alert.alert_type}
                  sx={{
                    borderRadius: "12px",
                    border: `1px solid ${vars.dropdownChipColor}`,
                    backgroundColor: vars.bodyBgColor,
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
                        {alerts.find((type: any) => type.id === alert.alert_type)?.name || "Unknown"}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{
                      p: 0,
                      display: "flex",
                      gap: ".5rem",
                      alignItems: 'center',
                      '& .MuiInputBase-root': {
                        backgroundColor: vars.whiteColor,
                        
                        '&.Mui-focused': {
                          '& .MuiOutlinedInput-notchedOutline': {
                            border: '0 !important',
                            boxShadow: 'none',
                          }
                        }
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
                        onInputBlur={onInputBlur}
                      />
                      <IconButton onClick={() => handleDelete(alert.id)}
                                  disabled={alert?.text?.trim() !== ''}
                      >
                        <DeleteOutlined />
                      </IconButton>
                    </AccordionDetails>
                  </Accordion>
                  {openFormIndex !== index && (
                    <Box display='flex' alignItems='center' gap='.5rem'>
                      <Box sx={{
                        borderRadius: ".5rem",
                        border: `1px solid ${vars.dropdownChipColor}`,
                        backgroundColor: vars.whiteColor,
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
                      <IconButton
                        onClick={() => handleDelete(alert.id)}
                        disabled={alert?.text?.trim() !== ''}
                      >
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
      <ConfirmationDialog
        open={openDialog}
        onConfirm={confirmDelete}
        onCancel={() => setOpenDialog(false)}
      />
    </Box>
  );
};

export default StatementAlertsAccordion;
