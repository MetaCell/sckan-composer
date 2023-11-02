import React from "react";
import { Box, Button, Table, TableBody } from "@mui/material";
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
  console.log(props);

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
  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = sortableItems.map((e: any) => e.id).indexOf(active.id);
      const newIndex = sortableItems.map((e: any) => e.id).indexOf(over.id);
      const sortedItems = arrayMove(sortableItems, oldIndex, newIndex);
      sortedItems.forEach(
        (via: any, index: number) =>
          (via.children.props.formData.display_order = index),
      );
      // @ts-ignore
      return sortedItems[oldIndex].onReorderClick(oldIndex, newIndex)();
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
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
            onDropIndexClick={element.onDropIndexClick(element.index)}
            disabled={props.disabled}
          />
        ))}
      </SortableContext>
      {props.canAdd && (
        <Box mt={1} ml={0.75}>
          <Button
            variant="text"
            color="info"
            onClick={props.onAddClick}
            startIcon={<AddCircleIcon />}
            disabled={props.disabled}
          >
            Add a {props.schema.name}
          </Button>
        </Box>
      )}
    </DndContext>
  );
}

export default ArrayFieldTemplate;
