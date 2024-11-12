import React, { useState, useEffect, useRef, useMemo } from 'react';
import './App.css';

const DiceRoller = () => {
  const [isRolling, setIsRolling] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 });

  const containerRef = useRef(null);
  const diceRef = useRef(null);
  const animationFrameRef = useRef(null);

  const GRAVITY = 0.8;
  const BOUNCE_FACTOR = 0.6;
  const FRICTION = 0.98;
  const DIE_SIZE = 60;

  const generateStippledShadow = (size) => {
    const shadowDots = [];
    const dotSize = 1;
    const density = 2000; // Increased for better shadow definition
    
    for (let i = 0; i < density; i++) {
      const x = Math.random() * 100;
      const y = Math.random() * 100;
      
      // Create a shadow gradient effect
      const distanceFromCorner = Math.sqrt(Math.pow(x, 2) + Math.pow(y - 100, 2)) / Math.sqrt(20000);
      const shadowIntensity = Math.max(0, 1 - distanceFromCorner);
      
      if (Math.random() < shadowIntensity) {
        const opacity = Math.random() * 0.4 * shadowIntensity; // Adjust max opacity as needed

        shadowDots.push(
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${dotSize}px`,
              height: `${dotSize}px`,
              backgroundColor: `rgba(0, 0, 0, ${opacity})`,
              borderRadius: '50%',
              left: `${x}%`,
              top: `${y}%`,
              pointerEvents: 'none',
            }}
          />
        );
      }
    }

    return shadowDots;
  };

  // Generate stippled shadows for each face once
  const stippledShadows = useMemo(() => {
    return Array(6).fill().map(() => generateStippledShadow(DIE_SIZE));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      const groundLevel = container.clientHeight * 0.8; // 20% up from the bottom
      const startX = (container.clientWidth - DIE_SIZE) / 2;
      const startY = groundLevel - DIE_SIZE;
      setPosition({ x: startX, y: startY });
    }
  }, []);

  useEffect(() => {
    if (!isDragging && (velocity.x !== 0 || velocity.y !== 0)) {
      animationFrameRef.current = requestAnimationFrame(animateThrow);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, velocity]);

  const snapToNearestFace = () => {
    let x = Math.round(rotation.x / 90) * 90;
    let y = Math.round(rotation.y / 90) * 90;
    let z = Math.round(rotation.z / 90) * 90;
    
    // Normalize rotations to be within 0-359 degrees
    x = ((x % 360) + 360) % 360;
    y = ((y % 360) + 360) % 360;
    z = ((z % 360) + 360) % 360;

    setRotation({ x, y, z });
  };

  const rollDice = () => {
    setIsRolling(true);
    const rollDuration = 1000;
    const startTime = Date.now();
    const startRotation = { ...rotation };
    const endRotation = {
      x: startRotation.x + Math.random() * 720 + 360,
      y: startRotation.y + Math.random() * 720 + 360,
      z: startRotation.z + Math.random() * 720 + 360
    };

    const animate = () => {
      const elapsedTime = Date.now() - startTime;
      const progress = Math.min(elapsedTime / rollDuration, 1);
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);

      setRotation({
        x: startRotation.x + (endRotation.x - startRotation.x) * easedProgress,
        y: startRotation.y + (endRotation.y - startRotation.y) * easedProgress,
        z: startRotation.z + (endRotation.z - startRotation.z) * easedProgress
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsRolling(false);
        snapToNearestFace();
      }
    };

    requestAnimationFrame(animate);
  };

  const startDrag = (clientX, clientY) => {
    setIsDragging(true);
    setVelocity({ x: 0, y: 0 });
  };

  const onDrag = (clientX, clientY) => {
    if (isDragging) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const groundLevel = containerRect.height * 0.8;
      
      const newX = Math.max(0, Math.min(clientX - containerRect.left - DIE_SIZE / 2, containerRect.width - DIE_SIZE));
      const newY = Math.max(0, Math.min(clientY - containerRect.top - DIE_SIZE / 2, groundLevel - DIE_SIZE));
      
      setPosition({ x: newX, y: newY });
    }
  };

  const endDrag = (clientX, clientY) => {
    if (isDragging) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const finalX = clientX - containerRect.left;
      const finalY = clientY - containerRect.top;
      const dx = finalX - position.x;
      const dy = finalY - position.y;
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      setVelocity({ x: dx * 0.2, y: dy * 0.2 });
      setIsDragging(false);
      
      if (speed > 5) {
        rollDice();
      }
    }
  };

  const animateThrow = () => {
    const containerRect = containerRef.current.getBoundingClientRect();
    const groundLevel = containerRect.height * 0.8;
  
    let newVelocity = {
      x: velocity.x * FRICTION,
      y: velocity.y + GRAVITY
    };
  
    let newX = position.x + newVelocity.x;
    let newY = position.y + newVelocity.y;
  
    // Enforce boundaries
    if (newX <= 0 || newX >= containerRect.width - DIE_SIZE) {
      newVelocity.x *= -BOUNCE_FACTOR;
      newX = Math.max(0, Math.min(newX, containerRect.width - DIE_SIZE));
    }
  
    if (newY <= 0 || newY >= groundLevel - DIE_SIZE) {
      newVelocity.y *= -BOUNCE_FACTOR;
      newY = Math.max(0, Math.min(newY, groundLevel - DIE_SIZE));
      if (newY === groundLevel - DIE_SIZE) {
        newVelocity.x *= FRICTION;
      }
    }
  
    setPosition({ x: newX, y: newY });
    setVelocity(newVelocity);
  
    if (Math.abs(newVelocity.x) > 0.1 || Math.abs(newVelocity.y) > 0.1 || newY < groundLevel - DIE_SIZE) {
      animationFrameRef.current = requestAnimationFrame(animateThrow);
    } else {
      setVelocity({ x: 0, y: 0 });
      snapToNearestFace();
    }
  };

  return (
    <div 
      ref={containerRef}
      className="dice-container"
      style={{ 
        width: '100%', 
        height: '100vh', 
        position: 'relative', 
        overflow: 'hidden',
        background: '#f9efcc',
        perspective: '1000px',
        perspectiveOrigin: '50% 50%', // Adjust this value to change the viewpoint    
      }}
      onMouseMove={(e) => onDrag(e.clientX, e.clientY)}
      onMouseUp={(e) => endDrag(e.clientX, e.clientY)}
      onMouseLeave={(e) => endDrag(e.clientX, e.clientY)}
      onTouchMove={(e) => onDrag(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={(e) => endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
    >
      <div
        ref={diceRef}
        className="dice"
        style={{
          position: 'absolute',
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: `${DIE_SIZE}px`,
          height: `${DIE_SIZE}px`,
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) rotateZ(${rotation.z}deg)`,
          transformOrigin: 'center center',      
          transition: isRolling ? 'transform 1s ease-out' : 'none',
          cursor: 'grab'
        }}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
      >
        {[
          { value: 1, rotateX: 0, rotateY: 0 },
          { value: 6, rotateX: 180, rotateY: 0 },
          { value: 2, rotateX: -90, rotateY: 0 },
          { value: 5, rotateX: 90, rotateY: 0 },
          { value: 3, rotateX: 0, rotateY: -90 },
          { value: 4, rotateX: 0, rotateY: 90 }
        ].map(({ value, rotateX, rotateY }, index) => (
          <div
            key={value}
            className="dice-face"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'white', // Changed to white for better contrast with shadow
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${(DIE_SIZE / 2) - 1}px)`,
              border: '3px solid',
              borderColor: 'rgba(190, 180, 160, 0.4)',
              boxSizing: 'border-box',
              borderRadius: '12%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: `${DIE_SIZE / 2}px`,
              fontWeight: 'bold',
              backfaceVisibility: 'hidden',
              overflow: 'hidden'
            }}
          >
            {/* Static stippled shadow effect on each face */}
            <div style={{ position: 'absolute', width: '100%', height: '100%', pointerEvents: 'none' }}>
              {stippledShadows[index]}
            </div>
            {/* Die face dots */}
            <div className="dice-dots" style={{ position: 'relative', width: '100%', height: '100%', zIndex: 1 }}>
              {[...Array(value)].map((_, i) => (
                <div
                  key={i}
                  className="dice-dot"
                  style={{
                    position: 'absolute',
                    width: `${DIE_SIZE / 7}px`,
                    height: `${DIE_SIZE / 7}px`,
                    backgroundColor: 'black',
                    borderRadius: '50%',
                    ...getDotPosition(value, i, DIE_SIZE),
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Updated helper function to position dots on die faces
function getDotPosition(value, index, size) {
  const positions = {
    1: [{ top: '50%', left: '50%' }],
    2: [{ top: '25%', left: '25%' }, { top: '75%', left: '75%' }],
    3: [{ top: '25%', left: '25%' }, { top: '50%', left: '50%' }, { top: '75%', left: '75%' }],
    4: [{ top: '25%', left: '25%' }, { top: '25%', left: '75%' }, { top: '75%', left: '25%' }, { top: '75%', left: '75%' }],
    5: [{ top: '25%', left: '25%' }, { top: '25%', left: '75%' }, { top: '50%', left: '50%' }, { top: '75%', left: '25%' }, { top: '75%', left: '75%' }],
    6: [{ top: '25%', left: '25%' }, { top: '25%', left: '75%' }, { top: '50%', left: '25%' }, { top: '50%', left: '75%' }, { top: '75%', left: '25%' }, { top: '75%', left: '75%' }]
  };
  return {
    top: `calc(${positions[value][index].top} - ${size / 14}px)`,
    left: `calc(${positions[value][index].left} - ${size / 14}px)`
  };
}

function App() {
  return (
    <div className="App">
      <DiceRoller />
    </div>
  );
}

export default App;