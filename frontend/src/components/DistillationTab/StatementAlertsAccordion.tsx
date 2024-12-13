import React, { useEffect, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Box,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import connectivityStatementService from "../../services/StatementService";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { DeleteOutlined } from "@mui/icons-material";
import statementService from "../../services/StatementService";
import Select from "@mui/material/Select";
import AlertMenuItem from "./AlertMenuItem";
import { vars } from "../../theme/variables";
import ConfirmationDialog from "./ConfiramtionDialog";
import Tooltip from "@mui/material/Tooltip";
import StatementForm from "../Forms/StatementForm";

const parseTextWithLinks = (text: string, vars: any): JSX.Element[] => {
  const urlRegex = /(https?:\/\/\S+|www\.\S+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi;
  
  return text.split(urlRegex).map((part, index) => {
    const isURL = urlRegex.test(part);
    if (isURL) {
      const href = part.startsWith("http") ? part : `http://${part}`;
      return (
        <React.Fragment key={index}>
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: vars.primary800, textDecoration: "underline" }}
          >
            {part}
          </a>
        </React.Fragment>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const DeleteAlertBtn = ({ alert, isDisabled, handleDelete }: any) => {
  return (
    <Tooltip
      title={
        alert?.text?.trim() !== "" && !isDisabled
          ? "To enable this icon, clear the comment"
          : null
      }
      arrow
    >
      <span>
        <IconButton
          onClick={() => handleDelete(alert.id)}
          disabled={alert?.text?.trim() !== "" || isDisabled}
        >
          <DeleteOutlined />
        </IconButton>
      </span>
    </Tooltip>
  );
};

const StatementAlertsAccordion = (props: any) => {
  const { statement, refreshStatement, isDisabled, setStatement } = props;
  
  const [expanded, setExpanded] = useState<boolean>(false);
  const [activeTypes, setActiveTypes] = useState<number[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [alertToDelete, setAlertToDelete] = useState<number | null>(null);
  const [hiddenAlerts, setHiddenAlerts] = useState<number[]>([]);
  const [statementAlerts, setStatementAlerts] = useState<any[]>([]);
  const [expandedPanels, setExpandedPanels] = useState<number[]>([]);
  
  const currentAlertRef = useRef<any>(null);
  
  const toggleAccordion = (id: number) => {
    setExpandedPanels((prev) =>
      prev.includes(id) ? prev.filter((panelId) => panelId !== id) : [...prev, id]
    );
  };
  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded);
  };
  
  const addAlert = (typeId: number) => {
    if (!activeTypes.includes(typeId)) {
      const wasPreviouslyAdded = hiddenAlerts.includes(typeId);
      const newAlert = { connectivity_statement_id: parseInt(statement.id), alert_type: typeId, text: "" };
      let isCancelled = false;
      
      if (wasPreviouslyAdded) {
        console.log(typeId)
        
      } else {
        connectivityStatementService.createAlert(newAlert, () => {
          isCancelled = true;
        })
          .then((res: any) => {
            if (isCancelled) return;
            
            currentAlertRef.current = res;
            const updatedAlerts = [
              ...(statement.statement_alerts || []),
              res,
            ];
            const updatedStatement = { ...statement, statement_alerts: updatedAlerts };
            setActiveTypes([...activeTypes, typeId]);
            setStatementAlerts(updatedAlerts)
            setStatement(updatedStatement);
            setExpandedPanels((prev) => [...prev, res.id]);
          })
      }
    }
  };
  
  const confirmDelete = async () => {
    if (alertToDelete === null) return;
    
    let isCancelled = false;
    
    try {
      await statementService
        .destroyAlert(alertToDelete, parseInt(statement.id), () => {
          isCancelled = true;
        })
        .then(() => {
          if (isCancelled) return;
          
          refreshStatement();
        });
    } catch (error) {
      if (!isCancelled) {
        alert(`Error deleting alert: ${error}`);
      }
    } finally {
      if (!isCancelled) {
        setExpandedPanels([])
        setOpenDialog(false);
        setAlertToDelete(null);
      }
    }
  };
  
  const handleDelete = async (id: number) => {
    setAlertToDelete(id);
    setOpenDialog(true);
  };
  
  useEffect(() => {
    connectivityStatementService.getAlertsList().then((res) => {
      setAlerts(res.results);
    });
  }, []);
  
  useEffect(() => {
    setActiveTypes(statement.statement_alerts.map((row: any) => row.alert_type));
    setStatementAlerts(statement.statement_alerts);
  }, [statement]);
  const hideAlert = (typeId: number) => {
    console.log(typeId)
  };
  
  const onInputBlur = async (value: string, alertId: number) => {
    const alertRef = currentAlertRef.current;
    if (!alertRef) return;
    
    const alert = statementAlerts.find(alert => alert.id === alertId)
    const updatedAlert = { ...alert, text: value };
    
    await connectivityStatementService
      .updateAlert(alertId, updatedAlert, () => {
        return;
      })
      .then(() => {
         refreshStatement()
      });
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {!isDisabled && (
              <Select
                sx={{
                  alignSelf: "flex-end",
                  fontWeight: 600,
                  borderRadius: "6.25rem",
                  border: `1px solid ${vars.buttonOutlinedBorderColor}`,
                  boxShadow: "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                  minWidth: "10rem",
                  padding: "0.625rem 1rem",
                  
                  "& .MuiSelect-select": {
                    padding: 0,
                  },
                }}
                value=""
                displayEmpty
                renderValue={() => "Display alerts"}
                MenuProps={{
                  PaperProps: {
                    style: {
                      width: "19.25rem",
                      padding: 0,
                      boxShadow:
                        "0px 12px 16px -4px rgba(16, 24, 40, 0.08), 0px 4px 6px -2px rgba(16, 24, 40, 0.03)",
                    },
                  },
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      padding: "0.875rem 0.875rem 0.5rem 0.875rem",
                      color: vars.inputPlaceholderColor,
                      fontWeight: 700,
                      fontSize: "0.75rem",
                    }}
                  >
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
                        alertStatus={"available"}
                      />
                    ))}
                </Box>
                
                {alerts.filter((type: any) => activeTypes.includes(type.id)).length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        padding: "0.875rem 0.875rem 0.5rem 0.875rem",
                        color: vars.inputPlaceholderColor,
                        fontWeight: 700,
                        fontSize: "0.75rem",
                      }}
                    >
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
                          alertStatus={"displayed"}
                          hideAlert={hideAlert}
                        />
                      ))}
                  </Box>
                )}
              </Select>
            )}
            <Stack spacing="2rem" pt=".75rem" pb=".75rem">
              {statementAlerts?.map((alert: any) => (
                <Box
                  key={alert.id}
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
                    disabled={isDisabled}
                    expanded={expandedPanels.includes(alert.id)}
                    onChange={() => toggleAccordion(alert.id)}
                    elevation={0}
                    sx={{
                      "&.MuiPaper-root": {
                        backgroundColor: "transparent",
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
                      sx={{ p: 0, display: "flex", flexDirection: "row-reverse", m: 0, '&.Mui-disabled':{
                          opacity: '1 !important',
                        }
                      }}
                    >
                      <Typography variant="subtitle1" ml={1}>
                        {
                          alerts.find(
                            (type: any) => type.id === alert.alert_type
                          )?.name || "Unknown"
                        }
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails
                      sx={{
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
                      }}
                    >
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
                        ref={currentAlertRef}
                        alertId={alert.id}
                      />
                      <DeleteAlertBtn
                        alert={alert}
                        isDisabled={isDisabled}
                        handleDelete={handleDelete}
                      />
                    </AccordionDetails>
                  </Accordion>
                  {!expandedPanels.includes(alert.id) && (
                    <Box display="flex" alignItems="center" gap=".5rem">
                      <Box
                        sx={{
                          borderRadius: ".5rem",
                          border: `1px solid ${vars.dropdownChipColor}`,
                          backgroundColor: vars.whiteColor,
                          textAlign: "left",
                          width: "100%",
                          padding: ".75rem",
                          boxShadow:
                            "0px 1px 2px 0px rgba(16, 24, 40, 0.05)",
                        }}
                      >
                        <Typography
                          component="p"
                          variant="body2"
                          color={vars.darkTextColor}
                        >
                          {parseTextWithLinks(alert.text, vars)}
                        </Typography>
                      </Box>
                      <DeleteAlertBtn
                        alert={alert}
                        isDisabled={isDisabled}
                        handleDelete={handleDelete}
                      />
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
