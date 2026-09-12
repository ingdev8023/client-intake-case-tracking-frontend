export function StateBlock({ title, message }) {
  return (
    <div className="state-block" role="status">
      <strong>{title}</strong>
      {message && <p>{message}</p>}
    </div>
  );
}
