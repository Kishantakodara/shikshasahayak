import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string | null | undefined;
  className?: string;
  inline?: boolean;
}

/**
 * Regex matching math patterns:
 * 1. Display math: $$...$$ or \[...\]
 * 2. LaTeX environments: \begin{bmatrix|pmatrix|vmatrix|Vmatrix|matrix|align|aligned|gather|equation}...\end{...}
 * 3. Inline math: \(...\) or $...$
 * 4. Tagged math: [latex]...[/latex]
 */
const MATH_TOKEN_REGEX = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\begin\{(?:bmatrix|pmatrix|vmatrix|Vmatrix|matrix|align|aligned|gather|equation)\}[\s\S]+?\\end\{(?:bmatrix|pmatrix|vmatrix|Vmatrix|matrix|align|aligned|gather|equation)\}|\\\([\s\S]+?\\\)|\$(?:\\\$|[^\$\n])+?\$|\[latex\][\s\S]+?\[\/latex\])/gi;

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Split content into alternating plain text and math tokens
    const parts = content.split(MATH_TOKEN_REGEX);

    return parts
      .map((part) => {
        if (!part) return '';

        let math = '';
        let isDisplay = false;

        if (part.startsWith('$$') && part.endsWith('$$')) {
          math = part.slice(2, -2);
          isDisplay = true;
        } else if (part.startsWith('\\[') && part.endsWith('\\]')) {
          math = part.slice(2, -2);
          isDisplay = true;
        } else if (part.startsWith('\\(') && part.endsWith('\\)')) {
          math = part.slice(2, -2);
          isDisplay = false;
        } else if (part.startsWith('$') && part.endsWith('$')) {
          math = part.slice(1, -1);
          isDisplay = false;
        } else if (part.startsWith('[latex]') && part.endsWith('[/latex]')) {
          math = part.slice(7, -8);
          isDisplay = false;
        } else if (
          /^\\begin\{(?:bmatrix|pmatrix|vmatrix|Vmatrix|matrix|align|aligned|gather|equation)\}/i.test(part)
        ) {
          math = part;
          isDisplay = true;
        } else {
          // Plain text segment: escape HTML special characters to prevent injection
          return escapeHtml(part);
        }

        try {
          return katex.renderToString(math.trim(), {
            displayMode: inline ? false : isDisplay,
            throwOnError: false,
            strict: false,
            output: 'htmlAndMathml',
          });
        } catch {
          return escapeHtml(part);
        }
      })
      .join('');
  }, [content, inline]);

  if (!content) return null;

  return (
    <span
      className={`math-rendered-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default MathRenderer;
