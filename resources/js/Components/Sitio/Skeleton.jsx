export default function Skeleton({ width = '100%', height = 14, borderRadius = 6, style = {}, className = '' }) {
    return (
        <div
            className={className ? `sk ${className}` : 'sk'}
            style={{ width, height, borderRadius, ...style }}
        />
    );
}
