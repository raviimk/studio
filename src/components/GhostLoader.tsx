'use client';

import React from 'react';

export function GhostLoader() {
  return (
    <div className="ghost-loader-stage shrink-0">
      <div className="ghost-loader" role="status" aria-label="Loading">
        <svg
          className="ghost-loader__scene"
          viewBox="0 0 560 380"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g className="ghost-loader__bat-travel">
            <g transform="translate(0 28)">
              <g className="ghost-loader__bat-bob">
                <svg
                  className="ghost-loader__bat-bank"
                  width="120"
                  height="68"
                  viewBox="0 0 120 68"
                  overflow="visible"
                >
                  <path
                    className="ghost-loader__wing ghost-loader__wing--left"
                    d="M59 35
                      C46 29 37 15 35 5
                      C23 7 11 11 1 16
                      C14 19 18 25 15 35
                      C28 31 36 38 33 47
                      C46 43 52 51 59 61
                      Z"
                    fill="#f5f5f5"
                  ></path>

                  <path
                    className="ghost-loader__wing ghost-loader__wing--right"
                    d="M61 35
                      C74 29 83 15 85 5
                      C97 7 109 11 119 16
                      C106 19 102 25 105 35
                      C92 31 84 38 87 47
                      C74 43 68 51 61 61
                      Z"
                    fill="#e5e5e5"
                  ></path>

                  <path
                    d="M53 34
                      L53 22
                      L59 29
                      L65 22
                      L68 35
                      C72 44 67 55 60 63
                      C53 55 48 44 53 34
                      Z"
                    fill="#f5f5f5"
                  ></path>
                </svg>
              </g>
            </g>
          </g>

          <g transform="translate(61 177)">
            <g className="ghost-loader__ghost ghost-loader__ghost--left">
              <path
                className="ghost-loader__body"
                d="M17 47
                  C20 21 37 4 60 4
                  C83 4 100 21 103 47
                  L118 147
                  C120 158 114 163 105 158
                  L94 151
                  C85 145 78 154 71 162
                  C65 169 55 169 49 162
                  C42 154 35 145 26 151
                  L15 158
                  C6 163 1 158 3 148
                  Z"
              ></path>

              <path
                className="ghost-loader__fold"
                d="M65 8
                  C86 20 88 38 91 57
                  L106 148
                  C110 151 114 153 114 148
                  L101 47
                  C98 24 84 9 65 8
                  Z"
              ></path>

              <path
                className="ghost-loader__highlight"
                d="M23 47 C26 26 38 14 54 12"
              ></path>

              <g className="ghost-loader__eyes">
                <ellipse cx="57" cy="47" rx="5.5" ry="7.5"></ellipse>
                <ellipse cx="84" cy="47" rx="5.5" ry="7.5"></ellipse>
              </g>
            </g>
          </g>

          <g transform="translate(219 177)">
            <g className="ghost-loader__ghost ghost-loader__ghost--middle">
              <path
                className="ghost-loader__body"
                d="M17 47
                  C20 21 37 4 60 4
                  C83 4 100 21 103 47
                  L118 147
                  C120 158 114 163 105 158
                  L94 151
                  C85 145 78 154 71 162
                  C65 169 55 169 49 162
                  C42 154 35 145 26 151
                  L15 158
                  C6 163 1 158 3 148
                  Z"
              ></path>

              <path
                className="ghost-loader__fold"
                d="M65 8
                  C86 20 88 38 91 57
                  L106 148
                  C110 151 114 153 114 148
                  L101 47
                  C98 24 84 9 65 8
                  Z"
              ></path>

              <path
                className="ghost-loader__highlight"
                d="M23 47 C26 26 38 14 54 12"
              ></path>

              <g className="ghost-loader__eyes">
                <ellipse cx="57" cy="47" rx="5.5" ry="7.5"></ellipse>
                <ellipse cx="84" cy="47" rx="5.5" ry="7.5"></ellipse>
              </g>
            </g>
          </g>

          <g transform="translate(377 177)">
            <g className="ghost-loader__ghost ghost-loader__ghost--right">
              <path
                className="ghost-loader__body"
                d="M17 47
                  C20 21 37 4 60 4
                  C83 4 100 21 103 47
                  L118 147
                  C120 158 114 163 105 158
                  L94 151
                  C85 145 78 154 71 162
                  C65 169 55 169 49 162
                  C42 154 35 145 26 151
                  L15 158
                  C6 163 1 158 3 148
                  Z"
              ></path>

              <path
                className="ghost-loader__fold"
                d="M65 8
                  C86 20 88 38 91 57
                  L106 148
                  C110 151 114 153 114 148
                  L101 47
                  C98 24 84 9 65 8
                  Z"
              ></path>

              <path
                className="ghost-loader__highlight"
                d="M23 47 C26 26 38 14 54 12"
              ></path>

              <g className="ghost-loader__eyes">
                <ellipse cx="57" cy="47" rx="5.5" ry="7.5"></ellipse>
                <ellipse cx="84" cy="47" rx="5.5" ry="7.5"></ellipse>
              </g>
            </g>
          </g>

          <path
            className="ghost-loader__floor"
            d="M4 356 H556"
            fill="none"
            stroke-linecap="round"
          ></path>
        </svg>
      </div>
    </div>
  );
}
