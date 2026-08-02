import { cn } from '@/lib/utils' // Utility function to combine class names dynamically.
import React from 'react' // Import React for JSX and types.

interface IScrollableProps 
  extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement> {
    direction?: "row" | "column", // Optional prop to control scroll direction.
}

// Scrollable component: A reusable wrapper for creating scrollable divs.
export const Scrollable = ({ 
  children, // Content to be rendered inside the scrollable area.
  className, // Additional CSS classes for customization.
  direction, // Direction of scroll (horizontal or vertical).
  ...props // Any other HTML attributes passed to the div.
}: IScrollableProps) => {
  return (
    <div
      {...props} // Spread other HTML attributes onto the div.
      className={cn(
        // Combine the base classes with conditional ones based on the direction.
        "flex flex-nowrap overflow-x-auto scrollto gap-x-4 md:gap-x-2", 
        className, // Add any additional class names passed via props.
        direction == "row" && "flex-nowrap", // For horizontal scrolling.
        direction == "column" && "flex-wrap" // For vertical scrolling.
      )}
    >
      {children} {/* Render the children inside the div. */}
    </div>
  )
}
