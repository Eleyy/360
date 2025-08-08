import React from 'react';

interface CompassProps {
  heading: number;
}

export default function Compass({ heading }: CompassProps) {
  // Convert heading to compass direction
  const getDirection = (heading: number): string => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(heading / 45) % 8;
    return directions[index];
  };

  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '20px',
      fontSize: '14px',
      fontWeight: 'bold',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minWidth: '120px',
      justifyContent: 'center'
    }}>
      <span style={{ fontSize: '16px' }}>🧭</span>
      <span>{getDirection(heading)}</span>
      <span style={{ opacity: 0.8 }}>{heading.toFixed(0)}°</span>
    </div>
  );
} 