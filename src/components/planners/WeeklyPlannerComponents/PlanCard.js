import { Card, CardContent } from "@mui/material";
import { Draggable } from "@hello-pangea/dnd";
import { memo } from "react";
import { PlanCardContent } from "./PlanCardContent";

export const PlanCard = memo(({ plan, index, onEdit, onView }) => {
  const handleClick = () => onEdit(plan);
  const handleViewClick = () => onView(plan);


  return (
    <Draggable draggableId={String(plan.id)} index={index}>
      {(provided, snapshot) => (
        <Card
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          sx={{
            mb: 1.2,
            borderRadius: 2,
            cursor: "grab",
            transition: snapshot.isDragging 
              ? 'none' // Disable transitions while dragging to prevent conflicts
              : 'transform 0.2s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out', // Only transition specific properties
            border: '1px solid',
            borderColor: snapshot.isDragging ? 'primary.main' : 'grey.200',
            boxShadow: snapshot.isDragging 
              ? '0 8px 32px rgba(0,0,0,0.15)' 
              : '0 2px 8px rgba(0,0,0,0.04)',
            bgcolor: snapshot.isDragging ? 'primary.50' : 'white',
            transform: snapshot.isDragging 
              ? `${provided.draggableProps.style?.transform} rotate(2deg)` 
              : provided.draggableProps.style?.transform,
            "&:hover": !snapshot.isDragging ? {
              borderColor: 'primary.main',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              transform: 'translateY(-1px)'
            } : {},
            "&:active": !snapshot.isDragging ? { 
              cursor: "grabbing",
              transform: 'scale(1.02)'
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