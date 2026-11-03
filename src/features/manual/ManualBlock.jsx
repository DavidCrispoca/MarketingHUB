import Section from "../../components/Section.jsx";

// Shared shell for the manual blocks: title, count, description and a single
// action. It is a collapsible section so the manual opens one topic at a time.
export default function ManualBlock({ title, description, count, action, children }) {
  return (
    <Section
      className="m-block"
      title={title}
      description={description}
      badge={count}
    >
      {action ? <div className="m-block__action">{action}</div> : null}
      {children}
    </Section>
  );
}
