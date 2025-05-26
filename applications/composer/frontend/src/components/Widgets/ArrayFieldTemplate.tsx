import React, { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableItem } from "../ProofingTab/SortableItem";
import {checkOwnership, getOwnershipAlertMessage} from "../../helpers/ownershipAlert";
import {ChangeRequestStatus} from "../../helpers/settings";

function ArrayFieldTemplate(props: any) {
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(-1);
  const [destinationIndex, setDestinationIndex] = useState(-1);
  const sortableItems = props.items.map((item: any) => ({
    ...item,
    id: item.key,
  }));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragStart(event: any) {
    const { active } = event;
    setSourceIndex(sortableItems.map((e: any) => e.id).indexOf(active.id));
    setIsDragging(true);
  }

  function openConfirmationDialog(destination: any) {
    setDestinationIndex(destination);
    setShowConfirmation(true);
  }

  function handleConfirmation(confirm: boolean) {
    if (confirm) {
      const sortedItems = arrayMove(
        sortableItems,
        sourceIndex,
        destinationIndex,
      );
      sortedItems.forEach(
        (via: any, index: number) =>
          (via.children.props.formData.display_order = index),
      );
      // @ts-ignore
      sortedItems[sourceIndex].onReorderClick(sourceIndex, destinationIndex)();

      if (props.onElementReorder) {
        props.onElementReorder(sourceIndex, destinationIndex);
      }
    }
    setIsDragging(false);
    setShowConfirmation(false);
  }

 async function handleDragEnd(event: any) {
   try {
     await checkOwnership(
       props.id,
       async () => {
         const { active, over } = event;
         if (active.id !== over.id && isDragging) {
           openConfirmationDialog(
             sortableItems.map((e: any) => e.id).indexOf(over.id),
           );
         }
       },
       () => {
         return ChangeRequestStatus.CANCELLED;
         },
       (owner) => getOwnershipAlertMessage(owner)
     );
   } catch (error) {
     alert(`Error during add action: ${error}`);
   }
  }

  async function handleDelete(element: any) {
    try {
      await checkOwnership(
        props.id,
        async () => {
          // Call the original onDropIndexClick function
          element.onDropIndexClick(element.index)();
          
          // Additionally call onElementDelete if it's provided
          if (props.onElementDelete) {
            props.onElementDelete(element);
          }
        },
        () => {
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) => getOwnershipAlertMessage(owner) // Prompt message
      );
    } catch (error) {
      alert(`Error during add action: ${error}`);
    }
  }
  
  async function handleAdd(event: any) {
    try {
      await checkOwnership(
        props.id,
        async () => {
          props.onAddClick(event);
          if (props.onElementAdd) {
            props.onElementAdd();
          }
        },
        () => {
          return ChangeRequestStatus.CANCELLED;
        },
        (owner) => getOwnershipAlertMessage(owner) // Prompt message
      );
    } catch (error) {
      alert(`Error during add action: ${error}`);
    }
  }
  
  
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sortableItems}
        strategy={verticalListSortingStrategy}
      >
        {sortableItems.map((element: any, i: number) => (
          <SortableItem
            key={element.key}
            id={element.id}
            children={element.children}
            onDropIndexClick={() => handleDelete(element)}
            isDisabled={props.isDisabled}
            showReOrderingIcon={!props.isDisabled && props.showReOrderingIcon}
            hideDeleteBtn={props.hideDeleteBtn}
          />
        ))}
      </SortableContext>
      {props.canAdd && (
        <Box mt={1} ml={0.75}>
          <Button
            variant="text"
            color="info"
            onClick={handleAdd}
            startIcon={<AddCircleIcon />}
            disabled={props.isDisabled}
          >
            Add a {props.addButtonPlaceholder}
          </Button>
        </Box>
      )}

      <Dialog open={showConfirmation} onClose={() => handleConfirmation(false)}>
        <DialogTitle>Confirm Reorder</DialogTitle>
        <DialogContent>
          Are you sure you want to reorder this item?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmation(true)}>Yes</Button>
          <Button onClick={() => handleConfirmation(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </DndContext>
  );
}

export default ArrayFieldTemplate;
