
import React, { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface AspectRatioWrapperProps {
  children: React.ReactNode;
}

export const AspectRatioWrapper: React.FC<AspectRatioWrapperProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;

      const parentWidth = window.innerWidth;
      const parentHeight = window.innerHeight;

      const targetRatio = 16 / 9;
      const parentRatio = parentWidth / parentHeight;

      let newScale = 1;

      if (parentRatio > targetRatio) {
        // Parent is wider than 16:9
        newScale = parentHeight / 1080;
      } else {
        // Parent is taller than 16:9
        newScale = parentWidth / 1920;
      }

      setScale(newScale);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <Box
      ref={containerRef}
      sx={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        backgroundColor: 'transparent',
      }}
    >
      <Box
        sx={{
          width: 1920,
          height: 1080,
          minWidth: 1920,
          minHeight: 1080,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          boxShadow: '0 0 100px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};
