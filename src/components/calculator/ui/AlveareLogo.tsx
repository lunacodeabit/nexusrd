import React from 'react';

interface AlveareLogoProps {
  className?: string;
  monochrome?: boolean;
}

export const AlveareLogo: React.FC<AlveareLogoProps> = ({ className = '', monochrome = false }) => {
  // Use the official Alveare logo image
  const logoUrl = 'https://i.postimg.cc/qRxTHMSg/Asset-18-4x-1.png';

  return (
    <div className={`flex items-center ${className}`}>
      <img
        src={logoUrl}
        alt="Alveare Realty"
        style={{
          height: '40px',
          width: 'auto',
          filter: monochrome ? 'brightness(0) invert(1)' : 'none'
        }}
      />
    </div>
  );
};
