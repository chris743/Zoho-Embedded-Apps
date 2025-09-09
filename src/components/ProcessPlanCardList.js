import { memo } from "react";
import { ProcessPlanCard } from "./ProcessPlanCard";

export const ProcessPlanCardList = memo(({ cards, onEdit, onView }) => (
  <>
    {cards.map((plan, index) => (
      <ProcessPlanCard
        key={plan.id}
        plan={plan}
        index={index}
        onEdit={onEdit}
        onView={onView}
      />
    ))}
  </>
));

ProcessPlanCardList.displayName = 'ProcessPlanCardList';