// Shared shell for the manual blocks: title, count and a single action.
export default function ManualBlock({ title, count, action, children }) {
  return (
    <section className="m-block">
      <header className="m-block__head">
        <div className="m-block__heading">
          <h2 className="m-block__title">{title}</h2>
          {count === undefined ? null : (
            <span className="m-block__count" aria-hidden="true">
              {count}
            </span>
          )}
        </div>
        {action}
      </header>

      {children}
    </section>
  );
}
