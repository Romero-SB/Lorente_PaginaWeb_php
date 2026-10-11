export default function Skeleton({ width = '100%', height = 14, borderRadius = 6, style = {} }) {
    return <div className="sk" style={{ width, height, borderRadius, ...style }} />;
}
