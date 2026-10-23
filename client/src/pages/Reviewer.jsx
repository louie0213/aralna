import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';
import FlashcardStack from '../components/FlashcardStack.jsx';

function getTopics(reviewer) {
  if (Array.isArray(reviewer.topics) && reviewer.topics.length) return reviewer.topics;

  const bulletPoints = [
    reviewer.overview,
    ...(reviewer.keyTakeaways || []),
    ...(reviewer.learningObjectives || []),
    ...(reviewer.conceptRelationships || []),
    ...(reviewer.examples || []),
    ...(reviewer.commonMisconceptions || []),
    ...(reviewer.funFacts || []),
    ...(reviewer.keyTerms || []).map(({ term, definition }) => `${term}: ${definition}`),
  ].filter((point) => typeof point === 'string' && point.trim());

  return bulletPoints.length ? [{ name: 'Study notes', bulletPoints }] : [];
}

function getWorkedExampleSteps(workedExample) {
  const lines = String(workedExample || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const stepPattern = /^Step\s+\d+[:.)-]\s*/i;
  if (!lines.length || lines.some((line) => !stepPattern.test(line))) return [];
  return lines.map((line) => line.replace(stepPattern, '').trim()).filter(Boolean);
}

function ReviewerFilterDropdown({ label, value, options, onChange }) {
  const selected = options.find((option) => option.value === value);
  return (
    <details className="reviewer-filter-dropdown">
      <summary aria-label={`${label}: ${selected?.label || value}`}>
        <span>{selected?.label || value}</span>
        <span className="reviewer-filter-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="reviewer-filter-options" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={option.value === value ? 'selected' : ''}
            aria-pressed={option.value === value}
            onClick={(event) => {
              onChange(option.value);
              event.currentTarget.closest('details').open = false;
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </details>
  );
}

export default function Reviewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reviewer, setReviewer] = useState(null);
  const [error, setError] = useState('');
  const [view, setView] = useState('topics');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [selectedPerson, setSelectedPerson] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState('');

  useEffect(() => {
    api.get(`/reviewers/${id}`).then((d) => setReviewer(d.reviewer)).catch((err) => setError(err.message));
  }, [id]);

  async function remove() {
    if (!window.confirm('Delete this reviewer? This cannot be undone.')) return;
    try {
      await api.delete(`/reviewers/${id}`);
      navigate('/app/reviewers', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  }

  async function startPracticeQuiz() {
    setGeneratingQuiz(true);
    setQuizError('');
    try {
      const { quiz } = await api.post(`/reviewers/${id}/quiz`, {});
      navigate(`/app/quizzes/${quiz.id}`);
    } catch (err) {
      setQuizError(err.message);
    } finally {
      setGeneratingQuiz(false);
    }
  }

  if (error) return <div className="alert" role="alert">{error}</div>;
  if (!reviewer) return <p className="page-status">Loading...</p>;

  if (reviewer.status === 'failed') {
    return (
      <>
        <h1>{reviewer.documentName}</h1>
        <div className="alert" role="alert">{reviewer.error || 'This reviewer could not be generated.'}</div>
        <button className="btn btn-ghost" onClick={remove}>Delete</button>
      </>
    );
  }

  const topics = getTopics(reviewer);
  const timeline = (reviewer.timeline || []).filter(
    (entry) => entry && typeof entry.year === 'string' && typeof entry.summary === 'string'
  );
  const years = [...new Set(timeline.map((entry) => entry.year))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const keyTerms = (reviewer.keyTerms || []).filter(
    (entry) => entry && typeof entry.term === 'string' && typeof entry.definition === 'string'
  );
  const flashcards = keyTerms.length
    ? keyTerms.map(({ term, definition }) => ({ question: term, answer: definition }))
    : topics.map((topic) => ({
        question: `What are the key ideas in ${topic.name}?`,
        answer: topic.bulletPoints.join(' '),
      }));
  const people = [...new Set((reviewer.people || []).filter((person) => typeof person === 'string' && person.trim()))];
  const availableViews = [
    ...(topics.length > 0 ? ['topics'] : []),
    ...(people.length > 0 ? ['people'] : []),
    ...(years.length > 0 ? ['years'] : []),
    ...(keyTerms.length > 0 ? ['terms'] : []),
  ];
  const selectedView = availableViews.includes(view) ? view : availableViews[0] || 'topics';
  const selectedTopics = selectedTopic === 'all'
    ? topics
    : topics.filter((topic, index) => String(index) === selectedTopic);
  const selectedPeople = selectedPerson === 'all'
    ? people
    : people.filter((person) => person === selectedPerson);
  const selectedTimeline = selectedYear === 'all'
    ? timeline
    : timeline.filter((entry) => entry.year === selectedYear);
  const selectedKeyTerm = keyTerms.find((entry) => entry.term === selectedTerm);

  async function downloadReviewer(format) {
    setDownloading(true);
    setDownloadFormat(format);
    setDownloadError('');
    try {
      const filename = (reviewer.documentName || 'reviewer')
        .replace(/\.[^.]+$/, '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .trim() || 'reviewer';

      if (format === 'pdf') {
        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 18;
        const contentWidth = pageWidth - margin * 2;
        let y = margin;

        function addText(text, { size = 10, bold = false, indent = 0, after = 3 } = {}) {
          pdf.setFont('helvetica', bold ? 'bold' : 'normal');
          pdf.setFontSize(size);
          const lines = pdf.splitTextToSize(String(text), contentWidth - indent);
          const lineHeight = size * 0.45;
          for (const line of lines) {
            if (y + lineHeight > pageHeight - margin) {
              pdf.addPage();
              y = margin;
            }
            pdf.text(line, margin + indent, y);
            y += lineHeight;
          }
          y += after;
        }

        addText(reviewer.documentName, { size: 20, bold: true, after: 8 });
        for (const topic of topics) {
          addText(topic.name, { size: 15, bold: true, after: 4 });
          for (const point of topic.bulletPoints) {
            addText(`- ${point}`, { indent: 2, after: 2 });
          }
          if (topic.formulaExamples?.length) {
            addText('Formula examples', { size: 12, bold: true, after: 3 });
            for (const entry of topic.formulaExamples) {
              addText(`Formula: ${entry.formula}`, { bold: true, after: 2 });
              const steps = getWorkedExampleSteps(entry.workedExample);
              if (steps.length) {
                addText('Worked example:', { bold: true, after: 1 });
                steps.forEach((step, index) => addText(`Step ${index + 1}: ${step}`, { indent: 2, after: 1 }));
              } else {
                addText(`Worked example: ${entry.workedExample}`, { after: 2 });
              }
            }
          }
          y += 3;
        }

        if (timeline.length) {
          addText('Timeline', { size: 15, bold: true, after: 4 });
          for (const entry of timeline) {
            addText(entry.year, { size: 12, bold: true, after: 2 });
            addText(entry.summary);
          }
        }

        if (keyTerms.length) {
          addText('Key terms', { size: 15, bold: true, after: 4 });
          for (const entry of keyTerms) addText(`- ${entry.term}: ${entry.definition}`, { indent: 2 });
        }

        if (people.length) {
          addText('People', { size: 15, bold: true, after: 4 });
          for (const person of people) addText(`- ${person}`, { indent: 2, after: 1 });
        }

        pdf.save(`${filename}.pdf`);
        return;
      }

      const { Document: WordDocument, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');
      const paragraphs = [new Paragraph({ text: reviewer.documentName, heading: HeadingLevel.TITLE })];

      for (const topic of topics) {
        paragraphs.push(new Paragraph({ text: topic.name, heading: HeadingLevel.HEADING_1 }));
        for (const point of topic.bulletPoints) {
          paragraphs.push(new Paragraph({ text: point, bullet: { level: 0 } }));
        }
        if (topic.formulaExamples?.length) {
          paragraphs.push(new Paragraph({ text: 'Formula examples', heading: HeadingLevel.HEADING_2 }));
          for (const entry of topic.formulaExamples) {
            paragraphs.push(new Paragraph({
              children: [new TextRun({ text: 'Formula: ', bold: true }), new TextRun({ text: entry.formula, font: 'Consolas' })],
            }));
            const steps = getWorkedExampleSteps(entry.workedExample);
            if (steps.length) {
              paragraphs.push(new Paragraph({
                children: [new TextRun({ text: 'Worked example: ', bold: true })],
              }));
              steps.forEach((step, index) => {
                paragraphs.push(new Paragraph({ text: `Step ${index + 1}: ${step}` }));
              });
            } else {
              paragraphs.push(new Paragraph({
                children: [
                  new TextRun({ text: 'Worked example: ', bold: true }),
                  new TextRun(entry.workedExample),
                ],
              }));
            }
          }
        }
      }

      if (timeline.length) {
        paragraphs.push(new Paragraph({ text: 'Timeline', heading: HeadingLevel.HEADING_1 }));
        for (const entry of timeline) {
          paragraphs.push(new Paragraph({ text: entry.year, heading: HeadingLevel.HEADING_2 }));
          paragraphs.push(new Paragraph(entry.summary));
        }
      }

      if (keyTerms.length) {
        paragraphs.push(new Paragraph({ text: 'Key terms', heading: HeadingLevel.HEADING_1 }));
        for (const entry of keyTerms) {
          paragraphs.push(new Paragraph({
            children: [new TextRun({ text: `${entry.term}: `, bold: true }), new TextRun(entry.definition)],
            bullet: { level: 0 },
          }));
        }
      }

      const wordDocument = new WordDocument({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(wordDocument);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err.message || `Could not create the ${format.toUpperCase()} download.`);
    } finally {
      setDownloading(false);
      setDownloadFormat('');
    }
  }

  return (
    <>
      <header className="reviewer-header">
        <h1>{reviewer.documentName}</h1>
        <details className="reviewer-download-menu">
          <summary className="btn btn-ghost reviewer-download" aria-label="Choose download format">
            <span aria-hidden="true">↓</span> {downloading ? `Preparing ${downloadFormat.toUpperCase()}...` : 'Download'} <span className="reviewer-filter-chevron" aria-hidden="true">⌄</span>
          </summary>
          <div className="reviewer-download-options">
            <button type="button" onClick={(event) => {
              event.currentTarget.closest('details').open = false;
              downloadReviewer('docx');
            }} disabled={downloading}>Download as DOCX</button>
            <button type="button" onClick={(event) => {
              event.currentTarget.closest('details').open = false;
              downloadReviewer('pdf');
            }} disabled={downloading}>Download as PDF</button>
          </div>
        </details>
      </header>
      {downloadError && <div className="alert" role="alert">{downloadError}</div>}

      {(topics.length > 0 || years.length > 0 || keyTerms.length > 0) && (
        <div className="toolbar reviewer-filter">
          <span className="reviewer-filter-label">Show</span>
          <ReviewerFilterDropdown
            label="Reviewer view"
            value={selectedView}
            onChange={setView}
            options={[
              ...(topics.length > 0 ? [{ value: 'topics', label: 'Topics' }] : []),
              ...(people.length > 0 ? [{ value: 'people', label: 'Names' }] : []),
              ...(years.length > 0 ? [{ value: 'years', label: 'Years' }] : []),
              ...(keyTerms.length > 0 ? [{ value: 'terms', label: 'Terms' }] : []),
            ]}
          />
          {selectedView === 'topics' && topics.length > 0 && (
            <ReviewerFilterDropdown
              label="Choose a topic"
              value={selectedTopic}
              onChange={setSelectedTopic}
              options={[
                { value: 'all', label: 'All topics' },
                ...topics.map((topic, index) => ({ value: String(index), label: topic.name })),
              ]}
            />
          )}
          {selectedView === 'people' && people.length > 0 && (
            <ReviewerFilterDropdown
              label="Choose a person"
              value={selectedPerson}
              onChange={setSelectedPerson}
              options={[
                { value: 'all', label: 'All names' },
                ...people.map((person) => ({ value: person, label: person })),
              ]}
            />
          )}
          {selectedView === 'years' && years.length > 0 && (
            <ReviewerFilterDropdown
              label="Choose a year"
              value={selectedYear}
              onChange={setSelectedYear}
              options={[
                { value: 'all', label: 'All years' },
                ...years.map((year) => ({ value: year, label: year })),
              ]}
            />
          )}
          {selectedView === 'terms' && keyTerms.length > 0 && (
            <ReviewerFilterDropdown
              label="Choose a term"
              value={selectedTerm}
              onChange={setSelectedTerm}
              options={[
                { value: '', label: 'Choose a term' },
                ...keyTerms.map((entry) => ({ value: entry.term, label: entry.term })),
              ]}
            />
          )}
        </div>
      )}

      <div className="reviewer-topics">
        {selectedView === 'topics' && selectedTopics.map((topic, index) => (
          <section className="reviewer-topic" key={`${topic.name}-${index}`}>
            <h2>{topic.name}</h2>
            <ul>
              {topic.bulletPoints.map((point, pointIndex) => <li key={pointIndex}>{point}</li>)}
            </ul>
            {topic.formulaExamples?.length > 0 && (
              <div className="reviewer-formulas">
                {topic.formulaExamples.map((entry, formulaIndex) => (
                  <article className="reviewer-formula" key={`${entry.formula}-${formulaIndex}`}>
                    <p className="reviewer-formula-label">Formula</p>
                    <code>{entry.formula}</code>
                    <p className="reviewer-formula-label">Worked example</p>
                    {getWorkedExampleSteps(entry.workedExample).length ? (
                      <ol className="reviewer-worked-steps">
                        {getWorkedExampleSteps(entry.workedExample).map((step, stepIndex) => (
                          <li key={stepIndex}>{step}</li>
                        ))}
                      </ol>
                    ) : (
                      <p className="reviewer-worked-example">{entry.workedExample}</p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
        {selectedView === 'people' && selectedPeople.map((person) => (
          <section className="reviewer-topic" key={person}>
            <h2>{person}</h2>
          </section>
        ))}
        {selectedView === 'people' && people.length === 0 && <p className="muted">No people were identified in this document.</p>}
        {selectedView === 'years' && selectedTimeline.map((entry, index) => (
          <section className="reviewer-topic" key={`${entry.year}-${index}`}>
            <h2>{entry.year}</h2>
            <p>{entry.summary}</p>
          </section>
        ))}
        {selectedView === 'terms' && selectedKeyTerm && (
          <section className="reviewer-topic">
            <h2>{selectedKeyTerm.term}</h2>
            <p>{selectedKeyTerm.definition}</p>
          </section>
        )}
        {selectedView === 'topics' && topics.length === 0 && <p className="muted">No topic notes were generated for this document.</p>}
      </div>

      {flashcards.length > 0 && (
        <section className="reviewer-flashcards" aria-labelledby="reviewer-flashcards-title">
          <div className="reviewer-flashcards-heading">
            <div>
              <p className="page-eyebrow">ACTIVE RECALL</p>
              <h2 id="reviewer-flashcards-title">Flashcards</h2>
            </div>
            <p>Try to answer before flipping the card.</p>
          </div>
          <FlashcardStack cards={flashcards} />
        </section>
      )}

      {user.role === 'student' && (
        <>
          <section className="reviewer-quiz-cta">
            <div>
              <p className="page-eyebrow">READY TO CHECK YOUR UNDERSTANDING?</p>
              <h2>Practice with this reviewer</h2>
              <p>Generate a quiz from these notes. Your score is recorded, with up to five attempts.</p>
            </div>
            <button className="btn btn-primary" type="button" onClick={startPracticeQuiz} disabled={generatingQuiz}>
              {generatingQuiz ? 'Preparing your quiz...' : 'Take practice quiz'} <span aria-hidden="true">↗</span>
            </button>
          </section>
          {quizError && <div className="alert" role="alert">{quizError}</div>}
        </>
      )}
      <button className="btn btn-ghost" onClick={remove}>Delete reviewer</button>
    </>
  );
}