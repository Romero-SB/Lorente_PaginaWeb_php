import { useState } from 'react';

export default function Tooltip({ text, children, position = 'top' }) {
    const [visible, setVisible] = useState(false);

    return (
        <span
            className="tt-wrap"
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
            onFocus={() => setVisible(true)}
            onBlur={() => setVisible(false)}
        >
            {children}
            {visible && (
                <span className={`tt tt-${position}`} role="tooltip">
                    {text}
                </span>
            )}
        </span>
    );
}
