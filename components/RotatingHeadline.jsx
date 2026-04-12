'use client';

import { useState, useEffect } from 'react';

export default function RotatingHeadline({ topics = [] }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (topics.length <= 1) return;

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % topics.length);
        setVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [topics.length]);

  if (!topics.length) return null;

  const current = topics[index];

  return (
    <span
      style={{
        display: 'inline-block',
        transition: 'opacity 0.3s ease',
        opacity: visible ? 1 : 0,
      }}
    >
      {current.name}
      {current.count != null && (
        <span style={{ marginLeft: '0.4em', opacity: 0.6, fontSize: '0.85em' }}>
          ({current.count})
        </span>
      )}
    </span>
  );
}
