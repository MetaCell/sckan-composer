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

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id && isDragging) {
      openConfirmationDialog(
        sortableItems.map((e: any) => e.id).indexOf(over.id),
      );
    }
  }

  function handleDelete(element: any) {
    // Call the original onDropIndexClick function
    element.onDropIndexClick(element.index)();

    // Additionally call onElementDelete if it's provided
    if (props.onElementDelete) {
      props.onElementDelete(element);
    }
  }

  function handleAdd(event: any) {
    // Call the default onAddClick function
    props.onAddClick(event);

    // Additionally call onElementAdd if it's provided
    if (props.onElementAdd) {
      props.onElementAdd();
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
        {sortableItems.map((element: any) => (
          <SortableItem
            key={element.key}
            id={element.id}
            children={element.children}
            onDropIndexClick={() => handleDelete(element)}
            disabled={props.disabled}
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
            disabled={props.disabled}
          >
            Add a {props.schema.name}
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
