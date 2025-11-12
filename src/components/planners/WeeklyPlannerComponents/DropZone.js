import { Droppable } from "@hello-pangea/dnd";
import { memo } from "react";
import { Box, Typography } from "@mui/material";
import { PlanCardList } from "./PlanCardList";


export const DropZone = memo(({ ymd, cards, onEdit, onView }) => (
  <Droppable droppableId={ymd}>
    {(provided, snapshot) => (
      <Box
        ref={provided.innerRef}
        {...provided.droppableProps}
        sx={{
          minHeight: 300,
          p: 2,
          bgcolor: snapshot.isDraggingOver 
            ? 'primary.50' 
            : 'transparent',
          transition: 'background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: snapshot.isDraggingOver ? 2 : 0,
          border: snapshot.isDraggingOver 
            ? '2px dashed' 
            : '2px solid transparent',
          borderColor: snapshot.isDraggingOver 
            ? 'primary.300' 
            : 'transparent',
          // Removed transform to prevent coordinate calculation issues with drag library
        }}
      >
        <PlanCardList cards={cards} onEdit={onEdit} onView={onView} />
        {cards.length === 0 && !snapshot.isDraggingOver && (
          <Box sx={{ 
            textAlign: 'center', 
            py: 4,
            color: 'grey.400'
          }}>
            <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
              No plans scheduled
            </Typography>
          </Box>
        )}
        {provided.placeholder}
      </Box>
    )}
  </Droppable>
));

DropZone.displayName = 'DropZone';