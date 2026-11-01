import React from 'react';
import {
  Layers,
  Scissors,
  Minimize2,
  RotateCw,
  Image as ImageIcon,
  FileCode,
  Binary,
  Type,
  FilePlus,
  Trash2,
  Hash,
  Stamp,
  Crop,
  ShieldCheck,
  Grid,
  Lock,
  Unlock,
  FileText,
  Presentation,
} from 'lucide-react';
import type { ToolIconName } from '../../config/tools';

const ICON_MAP: Record<ToolIconName, React.ComponentType<{ className?: string }>> = {
  layers: Layers,
  scissors: Scissors,
  minimize: Minimize2,
  rotate: RotateCw,
  image: ImageIcon,
  'file-code': FileCode,
  binary: Binary,
  type: Type,
  'file-plus': FilePlus,
  'trash-2': Trash2,
  hash: Hash,
  stamp: Stamp,
  crop: Crop,
  'shield-check': ShieldCheck,
  grid: Grid,
  lock: Lock,
  unlock: Unlock,
  'file-text': FileText,
  presentation: Presentation,
};

export const ToolIcon: React.FC<{ name: ToolIconName; className?: string }> = ({ name, className }) => {
  const Component = ICON_MAP[name] || FileText;
  return <Component className={className} />;
};