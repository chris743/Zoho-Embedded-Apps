import { createTheme } from '@mui/material/styles';

// Zoho-inspired color palette
export const ZohoColors = {
  primary: {
    main: '#4285F4', // Zoho blue
    light: '#6FA3FF',
    dark: '#2E5BCF',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FF6B35', // Zoho orange
    light: '#FF8A5C',
    dark: '#E5522A',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8F9FB',
    paper: '#FFFFFF',
    surface: '#F1F3F7',
    sidebar: '#2C3E50',
  },
  text: {
    primary: '#2C3E50',
    secondary: '#6C7B7F',
    disabled: '#9E9E9E',
  },
  success: {
    main: '#4CAF50',
    light: '#81C784',
    dark: '#388E3C',
  },
  warning: {
    main: '#FF9800',
    light: '#FFB74D',
    dark: '#F57C00',
  },
  error: {
    main: '#F44336',
    light: '#EF5350',
    dark: '#D32F2F',
  },
  info: {
    main: '#2196F3',
    light: '#64B5F6',
    dark: '#1976D2',
  }
};

// Main commodity color dictionary - specific colors for key commodities
const MAIN_COMMODITY_COLORS = {
  'BLOOD': '#ff3b3bff',        // Red for blood oranges
  'CARA CARA': '#ff6095ff',    // Pink for cara cara
  'MANDARIN': '#ff951bff',     // Orange for mandarins
  'MINNEOLA': '#F8C471',       // Golden for minneola
  'NAVEL': '#FFEAA7',          // Light yellow for navel
  'LEMON': '#F4D03F',          // Bright yellow for lemons
  'GRAPEFRUIT': '#96CEB4'      // Light green for grapefruit
};

// Fallback colors for other commodities
const FALLBACK_COMMODITY_COLORS = [
  '#45B7D1', '#DDA0DD', '#98D8C8', '#BB8FCE', '#85C1E9',
  '#82E0AA', '#F1948A', '#85C1E9', '#AED6F1', '#A9DFBF', 
  '#F9E79F', '#D7BDE2', '#A3E4D7', '#E8A87C', '#C7CEEA',
  '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF'
];

// Global commodity color mapping - maintains consistent order
let commodityColorMap = new Map();
let nextColorIndex = 0;

export function getCommodityColor(commodityName) {
  if (!commodityName) return '#E0E0E0';
  
  // Normalize commodity name for consistent lookup
  const normalizedName = commodityName.toUpperCase().trim();
  
  // Check if we already have a color for this commodity
  if (commodityColorMap.has(normalizedName)) {
    return commodityColorMap.get(normalizedName);
  }
  
  // First, check if it's a main commodity with a specific color
  if (MAIN_COMMODITY_COLORS[normalizedName]) {
    const color = MAIN_COMMODITY_COLORS[normalizedName];
    commodityColorMap.set(normalizedName, color);
    return color;
  }
  
  // Otherwise, assign from fallback colors
  const color = FALLBACK_COMMODITY_COLORS[nextColorIndex % FALLBACK_COMMODITY_COLORS.length];
  commodityColorMap.set(normalizedName, color);
  nextColorIndex++;
  
  return color;
}

// Function to reset the color mapping (useful for testing or when data changes significantly)
export function resetCommodityColors() {
  commodityColorMap.clear();
  nextColorIndex = 0;
}

// Function to get all main commodity colors (useful for debugging or UI)
export function getMainCommodityColors() {
  return { ...MAIN_COMMODITY_COLORS };
}

// Function to initialize commodity colors in a consistent order
export function initializeCommodityColors(commodityNames) {
  resetCommodityColors();
  
  // Normalize and deduplicate commodity names
  const normalizedCommodities = [...new Set(commodityNames)]
    .filter(name => name && name.trim())
    .map(name => name.toUpperCase().trim());
  
  // Sort commodity names alphabetically for consistent ordering
  const sortedCommodities = normalizedCommodities.sort();
  
  // Pre-assign colors to all commodities
  sortedCommodities.forEach(commodityName => {
    if (commodityName) {
      // Check if it's a main commodity first
      if (MAIN_COMMODITY_COLORS[commodityName]) {
        commodityColorMap.set(commodityName, MAIN_COMMODITY_COLORS[commodityName]);
      } else {
        // Assign from fallback colors
        const color = FALLBACK_COMMODITY_COLORS[nextColorIndex % FALLBACK_COMMODITY_COLORS.length];
        commodityColorMap.set(commodityName, color);
        nextColorIndex++;
      }
    }
  });
}

export function getContrastColor(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.6 ? '#2C3E50' : '#FFFFFF';
}

// Zoho-inspired Material-UI theme
export const zohoTheme = createTheme({
  palette: {
    primary: ZohoColors.primary,
    secondary: ZohoColors.secondary,
    background: ZohoColors.background,
    text: ZohoColors.text,
    success: ZohoColors.success,
    warning: ZohoColors.warning,
    error: ZohoColors.error,
    info: ZohoColors.info,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: ZohoColors.text.primary,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: ZohoColors.text.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      color: ZohoColors.text.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: ZohoColors.text.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: ZohoColors.text.primary,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      color: ZohoColors.text.primary,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      color: ZohoColors.text.primary,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      color: ZohoColors.text.secondary,
    },
    body1: {
      fontSize: '0.875rem',
      color: ZohoColors.text.primary,
    },
    body2: {
      fontSize: '0.75rem',
      color: ZohoColors.text.secondary,
    },
    button: {
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 500,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          backgroundColor: ZohoColors.primary.main,
          '&:hover': {
            backgroundColor: ZohoColors.primary.dark,
          },
        },
        outlined: {
          borderColor: '#E0E4E7',
          color: ZohoColors.text.primary,
          '&:hover': {
            backgroundColor: '#F8F9FB',
            borderColor: ZohoColors.primary.main,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.08)',
          borderRadius: '8px',
          border: '1px solid #E8EBF0',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E0E4E7',
            },
            '&:hover fieldset': {
              borderColor: '#C4C9CF',
            },
            '&.Mui-focused fieldset': {
              borderColor: ZohoColors.primary.main,
            },
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          boxShadow: '0px 8px 32px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: ZohoColors.text.primary,
          boxShadow: '0px 1px 3px rgba(0,0,0,0.1)',
          borderBottom: '1px solid #E8EBF0',
        },
      },
    },
  },
  shape: {
    borderRadius: 6,
  },
});

// Common styling utilities
export const commonStyles = {
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E8EBF0',
    borderRadius: '8px',
    boxShadow: '0px 2px 8px rgba(0,0,0,0.06)',
    '&:hover': {
      boxShadow: '0px 4px 16px rgba(0,0,0,0.1)',
    },
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #E8EBF0',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: ZohoColors.text.primary,
    marginBottom: '16px',
  },
  fieldLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    color: ZohoColors.text.secondary,
    marginBottom: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  fieldValue: {
    fontSize: '0.875rem',
    color: ZohoColors.text.primary,
    fontWeight: 400,
  },
};