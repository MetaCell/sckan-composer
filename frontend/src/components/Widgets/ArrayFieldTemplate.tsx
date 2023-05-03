import React from "react";
import { ArrayFieldTemplateProps } from "@rjsf/utils";
import { Box, Button, Table, TableBody, TableContainer } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableItem } from "../ProofingTab/SortableItem";

function ArrayFieldTemplate(props: ArrayFieldTemplateProps) {
  const sortableItems = props.items.map((item) => ({ ...item, id: item.key }));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: any) {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = sortableItems.map((e: any) => e.id).indexOf(active.id);
      const newIndex = sortableItems.map((e: any) => e.id).indexOf(over.id);
      const sortedItems = arrayMove(sortableItems, oldIndex, newIndex);
      sortedItems.forEach(
        (via: any, index: number) =>
          (via.children.props.formData.display_order = index)
      );
      const result = sortedItems[oldIndex].onReorderClick(oldIndex, newIndex)();
      return result;
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
        <Table sx={{ borderSpacing: "0 8px", borderCollapse: "separate" }}>
          <TableBody>
            {sortableItems.map((element) => (
              <SortableItem
                key={element.key}
                id={element.id}
                children={element.children}
                onDropIndexClick={element.onDropIndexClick(element.index)}
                disabled={props.disabled}
              />
            ))}
          </TableBody>
        </Table>
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
            Add a via
          </Button>
        </Box>
      )}
    </DndContext>
  );
}

export default ArrayFieldTemplate;
