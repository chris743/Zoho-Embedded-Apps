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
          transition: 'background-color 0.2s ease-in-out',
          borderRadius: snapshot.isDraggingOver ? 1 : 0,
          border: snapshot.isDraggingOver 
            ? '2px dashed' 
            : '2px solid transparent',
          borderColor: snapshot.isDraggingOver 
            ? 'primary.300' 
            : 'transparent'
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