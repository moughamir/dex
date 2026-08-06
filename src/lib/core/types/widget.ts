export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetPlacement {
  id: string;
  kind: string;
  column: number;
  row: number;
  width: number;
  height: number;
}

export interface WidgetLayout {
  active: WidgetPlacement[];
}

export interface WidgetDescriptor {
  kind: string;
  name: string;
  description: string;
  default_size: WidgetSize;
}