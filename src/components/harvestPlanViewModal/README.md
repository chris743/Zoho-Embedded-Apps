# Harvest Plan View Modal

A comprehensive modal component for viewing harvest plan details with scout data integration.

## Structure

```
harvestPlanViewModal/
├── HarvestPlanViewModal.js     # Main modal component
├── index.js                    # Export barrel file
├── README.md                   # This documentation
├── components/                 # Subcomponents
│   ├── ModalHeader.js         # Header with title and actions
│   ├── PlanOverviewSection.js # Plan details section
│   ├── BlockInformationSection.js # Block info section
│   ├── ResourceAllocationSection.js # Contractor/rate info
│   ├── ScoutDataSection.js    # Scout reports section
│   └── ModalActions.js        # Footer actions
├── hooks/                     # Custom hooks
│   ├── useHarvestPlanData.js  # Data processing logic
│   └── useScoutReports.js     # Scout reports fetching
├── utils/                     # Utility functions
│   ├── datautils.js          # Data formatting utilities
│   └── dateutils.js          # Date formatting utilities
├── ImageCarousel.js          # Scout images carousel
├── SizeBarChart.js           # Size distribution chart
└── KV.js                     # Key-value display component
```

## Key Improvements

### 1. **Separation of Concerns**
- **Custom Hooks**: Data processing and API calls moved to dedicated hooks
- **Subcomponents**: Large modal broken into focused, reusable components
- **Utils**: Utility functions properly organized

### 2. **Better Maintainability**
- Each component has a single responsibility
- Easier to test individual pieces
- Clear prop interfaces
- Consistent naming conventions

### 3. **Improved Performance**
- Data processing logic memoized in hooks
- Components only re-render when their specific props change
- Scout reports fetched independently

### 4. **Enhanced Reusability**
- Subcomponents can be used independently
- Hooks can be reused in other components
- Clean export structure via index.js

## Usage

```jsx
import { HarvestPlanViewModal } from './components/harvestPlanViewModal';

<HarvestPlanViewModal
  open={isOpen}
  onClose={handleClose}
  plan={selectedPlan}
  blocks={blocks}
  contractors={contractors}
  commodities={commodities}
  pools={pools}
  scoutReportsSvc={scoutReportsService}
  onEdit={handleEdit}
/>
```

## Custom Hooks

### `useHarvestPlanData`
Processes plan data and builds lookup maps for associated entities.

### `useScoutReports`
Fetches and manages scout reports based on block ID.

## Components

### `ModalHeader`
Header with dynamic title and action buttons (copy, close).

### `PlanOverviewSection`
Displays basic plan information (date, delivery, bins, etc.).

### `BlockInformationSection`
Shows block details with commodity chip display.

### `ResourceAllocationSection`
Lists contractor assignments and rates.

### `ScoutDataSection`
Container for scout images and size charts.

### `ModalActions`
Footer with edit and close buttons.

## Utilities

### `KV` Component
Reusable key-value display component with consistent styling.

### `formatRate`
Formats monetary rates with proper currency display.

### `formatDate`
Consistent date formatting across the application.
