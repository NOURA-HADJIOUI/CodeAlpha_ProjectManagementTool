const COLORS = ["#54ACBF", "#26658C", "#023859", "#011C40"];

export default function Avatar({ name = "?", size = 26 }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <span
      className="avatar"
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: COLORS[name.length % COLORS.length],
      }}
    >
      {initials}
    </span>
  );
}