import "./section.css";

// A collapsible block with a title and a plain-language description.
// Native <details> keeps the keyboard and screen-reader behaviour for free.
export default function Section({
  title,
  description,
  eyebrow,
  defaultOpen = false,
  className = "",
  children,
}) {
  return (
    <details className={`ui-section${className ? ` ${className}` : ""}`} open={defaultOpen}>
      <summary className="ui-section__summary">
        <span className="ui-section__chevron" aria-hidden="true" />
        <span className="ui-section__text">
          {eyebrow ? <span className="ui-section__eyebrow">{eyebrow}</span> : null}
          <span className="ui-section__title">{title}</span>
          {description ? <span className="ui-section__description">{description}</span> : null}
        </span>
      </summary>
      <div className="ui-section__body">{children}</div>
    </details>
  );
}
