import { memo } from "react";
import { Box } from "@mui/material";
import { PlanCard } from "./PlanCard";

export const PlanCardList = memo(({ cards, onEdit, onView }) => (
  <Box>
    {cards.map((plan, index) => (
      <PlanCard
        key={plan.id}
        plan={plan}
        index={index}
        onEdit={onEdit}
        onView={onView}
      />
    ))}
  </Box>
));

PlanCardList.displayName = 'PlanCardList';