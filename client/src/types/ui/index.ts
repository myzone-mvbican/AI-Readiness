// Client-side UI-specific types

// Form field types
export interface FormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
}

// Sidebar navigation item
export interface NavItem {
  title: string;
  href: string;
  icon?: React.ElementType;
}

// Dashboard card props
export interface DashboardCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ElementType;
}

// Chart data types
export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Table column definition
export interface TableColumn<T> {
  id: string;
  header: string;
  accessorKey: keyof T;
  cell?: (info: any) => JSX.Element;
}

// Modal/Dialog state
export interface ModalState {
  isOpen: boolean;
  type?: string;
  data?: any;
}