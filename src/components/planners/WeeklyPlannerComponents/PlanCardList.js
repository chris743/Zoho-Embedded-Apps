import { memo } from "react";
import { PlanCard } from "./PlanCard";

export const PlanCardList = memo(({ cards, onEdit, onView }) => (
  <>
    {cards.map((plan, index) => (
      <PlanCard
        key={plan.id}
        plan={plan}
        index={index}
        onEdit={onEdit}
        onView = {onView}
      />
    ))}
  </>
));

PlanCardList.displayName = 'PlanCardList';