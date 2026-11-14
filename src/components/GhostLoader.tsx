'use client';

import React from 'react';

export function GhostLoader() {
  return (
    <div className="ghost-loader-stage shrink-0">
      <div className="ghost-loader">
        <svg
          className="ghost-loader__scene"
          viewBox="0 0 500 220"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Bat Animation */}
          <g className="ghost-loader__bat-travel">
            <g className="ghost-loader__bat-bob">
              <g className="ghost-loader__bat-bank">
                <path fill="#282828" d="M60 38c-2 0-4-1-5-3-1-2-1-4 1-5 2-2 5-2 7 0 2 1 2 3 1 5-1 2-3 3-4 3z" />
                <path className="ghost-loader__wing ghost-loader__wing--left" fill="#282828" d="M59 35l-25-5c-2 0-3 1-3 3s1 3 3 3l25 2c1 0 2-1 2-2s-1-1-2-1z" />
                <path className="ghost-loader__wing ghost-loader__wing--right" fill="#282828" d="M61 35l25-5c2 0 3 1 3 3s-1 3-3 3l-25 2c-1 0-2-1-2-2s1-1 2-1z" />
              </g>
            </g>
          </g>

          {/* Floor Line */}
          <line className="ghost-loader__floor" x1="0" y1="210" x2="500" y2="210" />

          {/* Three Ghosts */}
          {[
            { class: 'ghost-loader__ghost--left', x: 50 },
            { class: 'ghost-loader__ghost--middle', x: 190 },
            { class: 'ghost-loader__ghost--right', x: 330 },
          ].map((ghost, i) => (
            <g key={i} className={`ghost-loader__ghost ${ghost.class}`} transform={`translate(${ghost.x}, 0)`}>
              <path className="ghost-loader__body" d="M17 47 C20 21 37 4 60 4 C83 4 100 21 103 47 L118 147 C120 155 119 158 116 158 C111.3 158 106.7 158.8 102 158 C97.3 157.2 92.7 154.3 88 153 C83.3 151.7 78.7 153.5 74 158 C69.3 162.5 64.7 168 60 168 C55.3 168 50.7 162.5 46 158 C41.3 153.5 36.7 151.7 32 153 C27.3 154.3 22.7 157.2 18 158 C13.3 158.8 8.7 158 4 158 C0 158 1 154 3 148 Z" />
              <path className="ghost-loader__fold" d="M65 8 C86 20 88 38 91 57 L106 148 C110 151 114 153 114 148 L101 47 C98 24 84 9 65 8 Z" />
              <path className="ghost-loader__highlight" d="M28 35 C35 15 50 10 65 10" />
              <g className="ghost-loader__eyes">
                <circle cx="45" cy="45" r="4" />
                <circle cx="75" cy="45" r="4" />
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
