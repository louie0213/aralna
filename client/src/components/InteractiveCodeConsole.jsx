import { useState } from 'react';
import './InteractiveCodeConsole.css';

const INITIAL_VALUES = {
  variables: { name: 'Ari' },
  conditionals: { score: '78' },
  loops: { count: '5' },
  functions: { word: 'AralNa' },
  arrays: { values: '3, 7, 2' },
};

const TITLES = {
  variables: 'Variables',
  conditionals: 'Conditionals',
  loops: 'Loops',
  functions: 'Functions',
  arrays: 'Arrays',
};

const INPUTS = {
  variables: [{ key: 'name', label: 'Name', type: 'text', maxLength: 32 }],
  conditionals: [{ key: 'score', label: 'Score from 0 to 100', type: 'number', min: 0, max: 100 }],
  loops: [{ key: 'count', label: 'How many times?', type: 'number', min: 1, max: 10 }],
  functions: [{ key: 'word', label: 'Word or phrase', type: 'text', maxLength: 32 }],
  arrays: [{ key: 'values', label: 'Numbers, separated by commas', type: 'text', maxLength: 40 }],
};

const LANGUAGES = new Set(['Python', 'JavaScript', 'Java', 'C++', 'C#', 'Other']);
const EXAMPLES = new Set(Object.keys(INITIAL_VALUES));

function safeName(value) {
  const name = value.trim().replace(/[\r\n]/g, '').slice(0, 32);
  return name || 'Student';
}

function readNumber(value, label, min, max) {
  if (!String(value).trim()) throw new Error(`${label} is required.`);
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new Error(`${label} must be a number from ${min} to ${max}.`);
  }
  return number;
}

function buildCode(language, example) {
  const isPython = language === 'Python';
  const isJavaScript = language === 'JavaScript';
  const isJava = language === 'Java';
  const isCpp = language === 'C++';
  const isCSharp = language === 'C#';

  if (example === 'variables') {
    if (isPython) return 'name = "{{name}}"\nprint(f"Hello, {name}!")';
    if (isJavaScript) return 'const name = "{{name}}";\nconsole.log(`Hello, ${name}!`);';
    if (isJava) return 'public class Main {\n  public static void main(String[] args) {\n    String name = "{{name}}";\n    System.out.println("Hello, " + name + "!");\n  }\n}';
    if (isCpp) return '#include <iostream>\n#include <string>\n\nint main() {\n  std::string name = "{{name}}";\n  std::cout << "Hello, " << name << "!" << std::endl;\n  return 0;\n}';
    if (isCSharp) return 'using System;\n\nclass Program {\n  static void Main() {\n    string name = "{{name}}";\n    Console.WriteLine("Hello, " + name + "!");\n  }\n}';
    return 'SET name TO "{{name}}"\nDISPLAY "Hello, " + name + "!"';
  }

  if (example === 'conditionals') {
    if (isPython) return 'score = {{score}}\nif score >= 60:\n    print("Pass")\nelse:\n    print("Try again")';
    if (isJavaScript) return 'const score = {{score}};\nif (score >= 60) {\n  console.log("Pass");\n} else {\n  console.log("Try again");\n}';
    if (isJava) return 'public class Main {\n  public static void main(String[] args) {\n    int score = {{score}};\n    if (score >= 60) {\n      System.out.println("Pass");\n    } else {\n      System.out.println("Try again");\n    }\n  }\n}';
    if (isCpp) return '#include <iostream>\n\nint main() {\n  int score = {{score}};\n  if (score >= 60) {\n    std::cout << "Pass" << std::endl;\n  } else {\n    std::cout << "Try again" << std::endl;\n  }\n  return 0;\n}';
    if (isCSharp) return 'using System;\n\nclass Program {\n  static void Main() {\n    int score = {{score}};\n    if (score >= 60) {\n      Console.WriteLine("Pass");\n    } else {\n      Console.WriteLine("Try again");\n    }\n  }\n}';
    return 'SET score TO {{score}}\nIF score >= 60 THEN\n  DISPLAY "Pass"\nELSE\n  DISPLAY "Try again"';
  }

  if (example === 'loops') {
    if (isPython) return 'for number in range(1, {{count}} + 1):\n    print(number)';
    if (isJavaScript) return 'for (let number = 1; number <= {{count}}; number++) {\n  console.log(number);\n}';
    if (isJava) return 'public class Main {\n  public static void main(String[] args) {\n    for (int number = 1; number <= {{count}}; number++) {\n      System.out.println(number);\n    }\n  }\n}';
    if (isCpp) return '#include <iostream>\n\nint main() {\n  for (int number = 1; number <= {{count}}; number++) {\n    std::cout << number << std::endl;\n  }\n  return 0;\n}';
    if (isCSharp) return 'using System;\n\nclass Program {\n  static void Main() {\n    for (int number = 1; number <= {{count}}; number++) {\n      Console.WriteLine(number);\n    }\n  }\n}';
    return 'FOR number FROM 1 TO {{count}}\n  DISPLAY number';
  }

  if (example === 'functions') {
    if (isPython) return 'def count_characters(text):\n    return len(text)\n\nprint(count_characters("{{word}}"))';
    if (isJavaScript) return 'function countCharacters(text) {\n  return text.length;\n}\n\nconsole.log(countCharacters("{{word}}"));';
    if (isJava) return 'public class Main {\n  static int countCharacters(String text) {\n    return text.length();\n  }\n\n  public static void main(String[] args) {\n    System.out.println(countCharacters("{{word}}"));\n  }\n}';
    if (isCpp) return '#include <iostream>\n#include <string>\n\nint countCharacters(const std::string& text) {\n  return static_cast<int>(text.length());\n}\n\nint main() {\n  std::cout << countCharacters("{{word}}") << std::endl;\n  return 0;\n}';
    if (isCSharp) return 'using System;\n\nclass Program {\n  static int CountCharacters(string text) {\n    return text.Length;\n  }\n\n  static void Main() {\n    Console.WriteLine(CountCharacters("{{word}}"));\n  }\n}';
    return 'FUNCTION countCharacters(text)\n  RETURN the number of characters in text\n\nDISPLAY countCharacters("{{word}}")';
  }

  if (isPython) return 'numbers = [{{values}}]\nprint(sum(numbers))';
  if (isJavaScript) return 'const numbers = [{{values}}];\nconsole.log(numbers.reduce((sum, number) => sum + number, 0));';
  if (isJava) return 'public class Main {\n  public static void main(String[] args) {\n    int[] numbers = { {{values}} };\n    int sum = 0;\n    for (int number : numbers) {\n      sum += number;\n    }\n    System.out.println("Sum: " + sum);\n  }\n}';
  if (isCpp) return '#include <iostream>\n\nint main() {\n  int numbers[] = { {{values}} };\n  int sum = 0;\n  for (int number : numbers) {\n    sum += number;\n  }\n  std::cout << "Sum: " << sum << std::endl;\n  return 0;\n}';
  if (isCSharp) return 'using System;\n\nclass Program {\n  static void Main() {\n    int[] numbers = { {{values}} };\n    int sum = 0;\n    foreach (int number in numbers) {\n      sum += number;\n    }\n    Console.WriteLine("Sum: " + sum);\n  }\n}';
  return 'SET numbers TO [{{values}}]\nDISPLAY the sum of numbers';
}

function simulate(example, values) {
  if (example === 'variables') return `Hello, ${safeName(values.name)}!`;
  if (example === 'conditionals') {
    const score = readNumber(values.score, 'Score', 0, 100);
    return score >= 60 ? 'Pass' : 'Try again';
  }
  if (example === 'loops') {
    const count = readNumber(values.count, 'Count', 1, 10);
    if (!Number.isInteger(count)) throw new Error('Count must be a whole number.');
    return Array.from({ length: count }, (_, index) => String(index + 1)).join('\n');
  }
  if (example === 'functions') {
    return String(safeName(values.word).length);
  }
  const parts = values.values.split(',').map((part) => part.trim());
  const numbers = parts.map(Number);
  if (!numbers.length || numbers.length > 5 || parts.some((part) => !part) || numbers.some((number) => !Number.isFinite(number))) {
    throw new Error('Enter between one and five valid numbers separated by commas.');
  }
  return `Sum: ${numbers.reduce((sum, number) => sum + number, 0)}`;
}

export default function InteractiveCodeConsole({ language, example }) {
  const [values, setValues] = useState(() => INITIAL_VALUES[example] || {});
  const [output, setOutput] = useState(null);

  if (!LANGUAGES.has(language) || !EXAMPLES.has(example)) return null;
  const sampleLanguage = language === 'Other' ? 'Pseudocode' : language;

  function runExample() {
    try {
      setOutput({ type: 'success', text: simulate(example, values) });
    } catch (error) {
      setOutput({ type: 'error', text: error.message });
    }
  }

  function updateValue(key, value) {
    const input = INPUTS[example].find((item) => item.key === key);
    const cleanValue = key === 'values'
      ? value.replace(/[^\d,.\s-]/g, '').slice(0, input.maxLength)
      : input.type === 'number'
        ? value.replace(/[^\d.\s-]/g, '').slice(0, 12)
      : input.type === 'text'
        ? value.replace(/["'`\\\r\n]/g, '').slice(0, input.maxLength)
        : value;
    setValues((current) => ({ ...current, [key]: cleanValue }));
  }

  function renderCode() {
    return buildCode(language, example).split(/(\{\{\w+\}\})/g).map((part, index) => {
      const match = part.match(/^\{\{(\w+)\}\}$/);
      if (!match) return part;
      const input = INPUTS[example].find((item) => item.key === match[1]);
      return (
        <span
          key={`${match[1]}-${index}`}
          className="interactive-code-console__inline-input"
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          tabIndex={0}
          aria-label={`Edit ${input.label.toLowerCase()} in sample code`}
          spellCheck={false}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
          onBlur={(event) => updateValue(input.key, event.currentTarget.textContent || '')}
        >
          {values[input.key]}
        </span>
      );
    });
  }

  return (
    <section className="interactive-code-console" aria-labelledby="interactive-console-title">
      <header className="interactive-code-console__header">
        <div>
          <p className="page-eyebrow">TRY IT YOURSELF</p>
          <h2 id="interactive-console-title">Interactive code console</h2>
        </div>
        <span className="interactive-code-console__language">Detected: {language} · {TITLES[example]}</span>
      </header>
      <p className="interactive-code-console__description">
        Edit the highlighted values in the sample, then run this safe, predefined example. Your changes stay in this browser.
      </p>
      <div className="interactive-code-console__grid">
        <div className="interactive-code-console__editor">
          <div className="interactive-code-console__panel-title">Safe {sampleLanguage} template</div>
          <pre className="interactive-code-console__code"><code>{renderCode()}</code></pre>
          <div className="interactive-code-console__actions">
            <button className="btn btn-primary" type="button" onClick={runExample}>Run example</button>
            <button className="btn btn-ghost" type="button" onClick={() => setOutput(null)}>Clear output</button>
          </div>
        </div>
        <div className="interactive-code-console__output-panel">
          <div className="interactive-code-console__panel-title">Simulated output</div>
          <pre className={`interactive-code-console__output${output?.type === 'error' ? ' is-error' : ''}`} aria-live="polite">
            {output ? output.text : 'Run the example to see its output.'}
          </pre>
          <p className="interactive-code-console__note">This is a fixed simulation, not code execution.</p>
        </div>
      </div>
    </section>
  );
}
