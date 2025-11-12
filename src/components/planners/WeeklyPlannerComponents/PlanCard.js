import { Card, CardContent } from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";
import { memo } from "react";
import { PlanCardContent } from "./PlanCardContent";

export const PlanCard = memo(({ plan, index, onEdit, onView }) => {
  const handleClick = () => onEdit(plan);
  const handleViewClick = () => onView(plan);

  // Check if this is a placeholder block
  const isPlaceholder = plan.grower_block_source_database === "PLACEHOLDER" && plan.grower_block_id === 999999;

  return (
    <Draggable draggableId={String(plan.id)} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          onClick={(e) => {
            // Only trigger edit if not currently dragging
            if (!snapshot.isDragging) {
              handleClick();
            }
          }}
          sx={{
            mb: 1.2,
            borderRadius: 2,
            cursor: snapshot.isDragging ? "grabbing" : "grab",
            transition: snapshot.isDragging 
              ? 'none' 
              : 'box-shadow 0.2s ease-out, border-color 0.2s ease-out',
            border: '1px solid',
            borderColor: snapshot.isDragging 
              ? 'primary.main' 
              : (isPlaceholder ? 'warning.light' : 'grey.200'),
            boxShadow: snapshot.isDragging 
              ? '0 8px 32px rgba(0,0,0,0.15)' 
              : '0 2px 8px rgba(0,0,0,0.04)',
            bgcolor: snapshot.isDragging 
              ? 'primary.50' 
              : (isPlaceholder ? 'warning.50' : 'white'),
            opacity: snapshot.isDragging ? 1 : 1,
            zIndex: snapshot.isDragging ? 1000 : 'auto',
            // Explicitly avoid transform, position, top, left in sx to prevent conflicts with drag library
            "&:hover": !snapshot.isDragging ? {
              borderColor: isPlaceholder ? 'warning.main' : 'primary.main',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            } : {},
            "&:active": !snapshot.isDragging ? { 
              cursor: "grabbing",
            } : {}
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <PlanCardContent plan={plan} editClick={handleClick} viewClick={handleViewClick} />
          </CardContent>
        </Card>
      )}
    </Draggable>
  );
});

PlanCard.displayName = 'PlanCard';