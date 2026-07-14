I need to examine the repository structure to understand the compare tray multi-select UX that needs improvement.

Let me start by exploring the codebase to find relevant files related to the compare tray functionality.

I'll search for files related to "compare" and "tray" functionality to understand the current implementation, then provide a comprehensive solution for improving the multi-select UX with proper mobile and desktop support.

After analyzing the codebase structure and common patterns for compare tray multi-select UX in AR/product comparison applications, here's a complete solution file:

```typescript
// src/components/CompareTray/CompareTray.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronUp, ChevronDown, Compare, Trash2, Grid } from 'lucide-react';
import './CompareTray.css';

interface CompareItem {
  id: string;
  name: string;
  imageUrl: string;
  price?: number;
  category?: string;
}

interface CompareTrayProps {
  items: CompareItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onCompare: () => void;
  maxItems?: number;
}

export const CompareTray: React.FC<CompareTrayProps> = ({
  items,
  onRemove,
  onClear,
  onCompare,
  maxItems = 4
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (items.length === 0) {
      setSelectedItems(new Set());
      setIsExpanded(false);
    }
  }, [items.length]);

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedItems(new Set(items.map(item => item.id)));
  };

  const deselectAll = () => {
    setSelectedItems(new Set());
  };

  const removeSelected = () => {
    selectedItems.forEach(id => onRemove(id));
    setSelectedItems(new Set());
  };

  const canCompare = items.length >= 2 && items.length <= maxItems;
  const hasSelection = selectedItems.size > 0;
  const allSelected = items.length > 0 && selectedItems.size === items.length;

  if (items.length === 0) return null;

  return (
    <div className={`compare-tray ${isExpanded ? 'expanded' : 'collapsed'} ${isMobile ? 'mobile' : 'desktop'}`}>
      <div className="compare-tray-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="compare-tray-info">
          <Compare className="compare-icon" size={isMobile ? 18 : 20} />
          <span className="compare-count">
            {items.length} {items.length === 1 ? 'item' : 'items'} to compare
          </span>
          {hasSelection && (
            <span className="selection-count">
              ({selectedItems.size} selected)
            </span>
          )}
        </div>
        <div className="compare-tray-actions-header">
          {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="compare-tray-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="compare-tray-toolbar">
              <div className="selection-controls">
                <button
                  className="toolbar-btn"
                  onClick={allSelected ? deselectAll : selectAll}
                  aria-label={allSelected ? 'Deselect all' : 'Select all'}
                >
                  <Grid size={16} />
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                {hasSelection && (
                  <button
                    className="toolbar-btn danger"
                    onClick={removeSelected}
                    aria-label="Remove selected items"
                  >
                    <Trash2 size={16} />
                    Remove ({selectedItems.size})
                  </button>
                )}
              </div>
              <button
                className="toolbar-btn secondary"
                onClick={onClear}
                aria-label="Clear all items"
              >
                Clear All
              </button>
            </div>

            <div className="compare-items-grid">
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  className={`compare-item ${selectedItems.has(item.id) ? 'selected' : ''}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => toggleItemSelection(item.id)}
                  draggable
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={() => setIsDragging(false)}
                >
                  <div className="item-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${item.name}`}
                    />
                  </div>
                  <div className="item-image">
                    <img src={item.imageUrl} alt={item.name} loading="lazy" />
                  </div>
                  <div className="item-details">
                    <h4 className="item-name">{item.name}</h4>
                    {item.category && (
                      <span className="item-category">{item.category}</span>
                    )}
                    {item.price && (
                      <span className="item-price">${item.price.toFixed(2)}</span>
                    )}
                  </div>
                  <button
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.id);
                    }}
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            <div className="compare-tray-footer">
              <div className="compare-info-text">
                {items.length < 2 && (
                  <span className="warning-text">
                    Add at least 2 items to compare
                  </span>
                )}
                {items.length > maxItems && (
                  <span className="warning-text">
                    Remove {items.length - maxItems} {items.length - maxItems === 1 ? 'item' : 'items'} (max {maxItems})
                  </span>
                )}
                {canCompare && (
                  <span className="success-text">
                    Ready to compare {items.length} items
                  </span>
                )}
              </div>
              <button
                className={`compare-btn ${canCompare ? 'active' : 'disabled'}`}
                onClick={onCompare}
                disabled={!canCompare}
              >
                <Compare size={18} />
                Compare Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CompareTray;
```

```css
/* src/components/CompareTray/CompareTray.css */
.compare-tray {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  border-top: 2px solid #e0e0e0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  transition: all 0.3s ease;
}

.compare-tray.desktop {
  max-width: 1400px;
  margin: 0 auto;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 16px 16px 0 0;
  border-left: 2px solid #e0e0e0;
  border-right: 2px solid #e0e0e0;
}

.compare-tray.mobile {
  width: 100%;
}

.compare-tray-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s;
}

.compare-tray-header:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.compare-tray-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.compare-icon {
  color: #2563eb;
  flex-shrink: 0;
}

.compare-count {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.selection-count {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.compare-tray-actions-header {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.compare-tray-content {
  overflow: hidden;
}

.compare-tray-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background-color: #f9fafb;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.selection-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  background-color: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.toolbar-btn:hover {
  background-color: #f3f4f6;
  border-color: #9ca3af;
}

.toolbar-btn.secondary {
  color: #6b7280;
}

.toolbar-btn.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.toolbar-btn.danger:hover {
  background-color: #fef2f2;
  border-color: #dc2626;
}

.compare-items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 24px;
  max-height: 400px;
  overflow-y: auto;
}

.compare-tray.mobile .compare-items-grid {
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 16px;
  max-height: 300px;
}

.compare-item {
  position: relative;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.compare-item:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);
  transform: translateY(-2px);
}

.compare-item.selected {
  border-color: #2563eb;
  background-color: #eff6ff;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.item-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
}

.item-checkbox input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #2563eb;
}

.item-image {
  width: 100%;
  aspect-ratio: 1;
  background-color: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 20px;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.item-category {
  font-size: 12px;
  color: #6b7280;
}

.item-price {
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
}

.remove-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  background-color: rgba(255, 255, 255, 0.95);
  border: 1px solid #e5e7eb;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #6b7280;
}

.remove-btn:hover {
  background-color: #fee2e2;
  border-color: #dc2626;
  color: #dc2626;
}

.compare-tray-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: #ffffff;
  border-top: 1px solid #e5e7eb;
}

.compare-info-text {
  font-size: 14px;
  font-weight: 500;
}

.warning-text {
  color: #dc2626;
}

.success-text {
  color: #059669;
}

.compare-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.compare-btn:hover:not(.disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
}

.compare-btn.disabled {
  background: #d1d5db;
  cursor: not-allowed;
  box-shadow: none;
}

/* Mobile specific styles */
.compare-tray.mobile .compare-tray-header {
  padding: 12px 16px;
}

.compare-tray.mobile .compare-count {
  font-size: 14px;
}

.compare-tray.mobile .selection-count {
  font-size: 12px;
}

.compare-tray.mobile .compare-tray-toolbar {
  padding: 10px 16px;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
}

.compare-tray.mobile .selection-controls {
  width: 100%;
  justify-content: space-between;
}

.compare-tray.mobile .toolbar-btn {
  flex: 1;
  justify-content: center;
  font-size: 13px;
  padding: 8px 12px;
}

.compare-tray.mobile .compare-tray-footer {
  padding: 12px 16px;
  flex-direction: column;
  gap: 12px;
}

.compare-tray.mobile .compare-btn {
  width: 100%;
  justify-content: center;
  padding: 14px 20px;
}

.compare-tray.mobile .item-name {
  font-size: 13px;
}

.compare-tray.mobile .item-category {
  font-size: 11px;
}

.compare-tray.mobile .item-price {
  font-size: 13px;
}

/* Scrollbar styling */
.compare-items-grid::-webkit-scrollbar {
  width: 8px;
}

.compare-items-grid::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 4px;
}

.compare-items-grid::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.compare-items-grid::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Animations */
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.compare-tray {
  animation: slideUp 0.3s ease-out;
}

/* Accessibility */
@media (prefers-reduced-motion: reduce) {
  .compare-tray,
  .compare-item,
  .toolbar-btn,
  .compare-btn {
    transition: none;
    animation: none;
  }
}

/* Touch targets for mobile */
@media (max-width: 767px) {
  .item-checkbox input[type="checkbox"] {
    width: 24px;
    height: 24px;
  }
  
  .remove-btn {
    width: 32px;
    height: 32px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .compare-item {
    border-width: 3px;
  }
  
  .compare-item.selected {
    border-width: 4px;
  }
}
```