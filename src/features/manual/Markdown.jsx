import ReactMarkdown from "react-markdown";

// react-markdown ignores raw HTML by default, so the text written by the team
// can never inject markup. Links open in a new tab.
function MarkdownLink({ node, children, ...props }) {
  void node;
  return (
    <a {...props} target="_blank" rel="noreferrer noopener">
      {children}
    </a>
  );
}

const COMPONENTS = { a: MarkdownLink };

export default function Markdown({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown components={COMPONENTS}>{children ?? ""}</ReactMarkdown>
    </div>
  );
}
