import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';

/**
 * CustomDropdown Component
 * A custom select component without search functionality.
 * Supports full keyboard accessibility (arrows, enter, escape, tab).
 * 
 * @param {Array} options - Array of { value, label } objects.
 * @param {any} value - Currently selected value.
 * @param {Function} onChange - Callback function when an option is selected.
 * @param {string} placeholder - Text to show when no value is selected.
 * @param {string} className - Additional CSS classes for the container.
 */
const CustomDropdown = ({ 
  options, 
  value, 
  onChange, 
  onAdd, 
  placeholder = "Select option...", 
  className = "",
  height = "h-[30px] md:h-[34px]",
  rounded = "rounded",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  const allOptions = [{ value: '', label: placeholder }, ...options];
  const selectedOption = allOptions.find(opt => opt.value === value);

  const hasAddButton = !!onAdd;
  const totalItemCount = allOptions.length + (hasAddButton ? 1 : 0);

  // Initialize/reset focusedIndex when dropdown opens/closes
  useEffect(() => {
    if (isOpen) {
      const idx = allOptions.findIndex(opt => opt.value === value);
      setFocusedIndex(idx >= 0 ? idx : 0);
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, value]);

  // Determine direction based on space
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 300; // Estimated max height
      if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
        setOpenUp(true);
      } else {
        setOpenUp(false);
      }
    }
  }, [isOpen]);

  // Scroll focused item into view
  useEffect(() => {
    if (isOpen && focusedIndex >= 0) {
      if (focusedIndex < allOptions.length && listRef.current) {
        const activeEl = listRef.current.children[focusedIndex];
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest' });
        }
      }
    }
  }, [focusedIndex, isOpen, allOptions.length]);

  // Close dropdown when clicking/touching outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
    };
  }, []);

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };



  const handleBlur = (e) => {
    // If focus leaves the dropdown wrapper container, close the dropdown
    if (dropdownRef.current && !dropdownRef.current.contains(e.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => (prev + 1) % totalItemCount);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex(prev => (prev - 1 + totalItemCount) % totalItemCount);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (isOpen) {
          if (focusedIndex >= 0 && focusedIndex < allOptions.length) {
            onChange(allOptions[focusedIndex].value);
            setIsOpen(false);
            if (triggerRef.current) triggerRef.current.focus();
          } else if (focusedIndex === allOptions.length && onAdd) {
            onAdd();
            setIsOpen(false);
            if (triggerRef.current) triggerRef.current.focus();
          }
        } else {
          setIsOpen(true);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
          if (triggerRef.current) triggerRef.current.focus();
        }
        break;
      case 'Tab':
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className={`relative ${className}`} 
      ref={dropdownRef}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      {/* Selection Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={`w-full bg-gray-50 border border-gray-200 ${rounded} px-2 py-1 flex justify-between items-center cursor-pointer hover:border-sky-500 ${height} shadow-sm group outline-none focus:ring-2 focus:ring-sky-500/20 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:border-gray-200`}
      >
        <span className={`text-xs truncate ${selectedOption && selectedOption.value !== '' ? 'text-gray-900' : 'text-gray-400 font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`text-gray-400 group-hover:text-sky-500 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute left-0 right-0 ${openUp ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-gray-200 rounded shadow-2xl z-[150] overflow-hidden min-w-[180px]`}>
          
          {/* Options List */}
          <div className="max-h-40 overflow-y-auto py-1 scrollbar-hide" ref={listRef}>
            {allOptions.length > 0 ? (
              allOptions.map((opt, idx) => (
                <div
                  key={opt.value}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`px-3 py-1.5 text-xs cursor-pointer flex justify-between items-center transition-colors group ${
                    value === opt.value
                      ? 'bg-sky-50/50 text-sky-700 font-semibold'
                      : 'text-gray-700'
                  } ${
                    focusedIndex === idx 
                      ? 'bg-sky-100 text-sky-900 font-bold' 
                      : 'hover:bg-sky-50'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && (
                    <Check size={12} className="text-sky-600 flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-[10px] text-center text-gray-400 italic font-medium uppercase tracking-tight">
                No options available
              </div>
            )}
          </div>

          {/* Always visible Add New at the bottom */}
          {onAdd && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
                setIsOpen(false);
              }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAdd();
                setIsOpen(false);
              }}
              className={`w-full border-t border-gray-100 px-3 py-2 text-sky-600 transition-all flex items-center justify-center gap-2 bg-white active:bg-sky-100 ${
                focusedIndex === allOptions.length 
                  ? 'bg-sky-100 font-bold' 
                  : 'hover:bg-sky-50'
              }`}
            >
              <Plus size={14} strokeWidth={3} />
              <span className="text-[10px] font-black uppercase tracking-widest">Add New</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
