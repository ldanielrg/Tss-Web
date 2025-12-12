import React, { useState, ReactNode } from 'react';

interface TooltipProps {
  children: ReactNode;
  content: string;
  title?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ children, content, title }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute z-10 p-3 text-sm bg-gray-900 text-white rounded-lg shadow-lg max-w-xs -top-2 left-full ml-2 transform -translate-y-full">
          {title && <div className="font-semibold mb-1">{title}</div>}
          <div>{content}</div>
          <div className="absolute top-1/2 left-0 transform -translate-x-full -translate-y-1/2">
            <div className="border-4 border-transparent border-r-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;