export default function SectionHeader({ numeral, label, title, align = 'left' }) {
    return (
        <div className={`sh ${align === 'center' ? 'sh-c' : ''}`}>
            <div className="sh-row">
                {numeral && (
                    <span className="sh-num" aria-hidden="true">
                        {numeral}
                    </span>
                )}
                <span className="sh-hl" aria-hidden="true" />
                <span className="sh-label">{label}</span>
            </div>
            {title && (
                <>
                    <h2 className="sh-t">{title}</h2>
                    <span className="sh-hem" aria-hidden="true" />
                </>
            )}
        </div>
    );
}
