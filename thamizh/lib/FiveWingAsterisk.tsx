import Svg, { Line } from "react-native-svg";

export function FiveWingAsterisk({
  size = 28,
  color = "#000",
}: {
  size?: number;
  color?: string;
}) {
  const c = size / 2;
  const r = size / 2 - 1;
  const stroke = Math.max(2, size * 0.16);
  const wings = [0, 1, 2, 3, 4].map((i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    return {
      x: c + r * Math.cos(angle),
      y: c + r * Math.sin(angle),
    };
  });
  return (
    <Svg width={size} height={size}>
      {wings.map((w, i) => (
        <Line
          key={i}
          x1={c}
          y1={c}
          x2={w.x}
          y2={w.y}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}
