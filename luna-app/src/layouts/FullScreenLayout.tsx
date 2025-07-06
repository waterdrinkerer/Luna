import React from 'react';

interface FullScreenLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const FullScreenLayout = ({ children, className = '' }: FullScreenLayoutProps) => {
  return (
    <div className={`h-screen w-screen overflow-hidden flex flex-col ${className}`}>
      {children}
    </div>
  );
};

export default FullScreenLayout;
