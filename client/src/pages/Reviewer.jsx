import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';

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

  async function downloadReviewer() {
    setDownloading(true);
    setDownloadError('');
    try {
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
      const filename = (reviewer.documentName || 'reviewer')
        .replace(/\.[^.]+$/, '')
        .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
        .trim() || 'reviewer';
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setDownloadError(err.message || 'Could not create the DOCX download.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <header className="reviewer-header">
        <h1>{reviewer.documentName}</h1>
        <button className="btn btn-ghost reviewer-download" type="button" onClick={downloadReviewer} disabled={downloading}>
          <span aria-hidden="true">↓</span> {downloading ? 'Preparing DOCX...' : 'Download DOCX'}
        </button>
      </header>
      {downloadError && <div className="alert" role="alert">{downloadError}</div>}

      {(topics.length > 0 || years.length > 0 || keyTerms.length > 0) && (
        <div className="toolbar reviewer-filter">
          <label htmlFor="reviewer-view">Show</label>
          <select id="reviewer-view" value={selectedView} onChange={(e) => setView(e.target.value)}>
            {topics.length > 0 && <option value="topics">Topics</option>}
            {people.length > 0 && <option value="people">Names</option>}
            {years.length > 0 && <option value="years">Years</option>}
            {keyTerms.length > 0 && <option value="terms">Terms</option>}
          </select>
          {selectedView === 'topics' && topics.length > 0 && (
            <select aria-label="Choose a topic" value={selectedTopic} onChange={(e) => setSelectedTopic(e.target.value)}>
              <option value="all">All topics</option>
              {topics.map((topic, index) => <option key={`${topic.name}-${index}`} value={index}>{topic.name}</option>)}
            </select>
          )}
          {selectedView === 'people' && people.length > 0 && (
            <select aria-label="Choose a person" value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
              <option value="all">All names</option>
              {people.map((person) => <option key={person} value={person}>{person}</option>)}
            </select>
          )}
          {selectedView === 'years' && years.length > 0 && (
            <select aria-label="Choose a year" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="all">All years</option>
              {years.map((year) => <option key={year} value={year}>{year}</option>)}
            </select>
          )}
          {selectedView === 'terms' && keyTerms.length > 0 && (
            <select aria-label="Choose a term" value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)}>
              <option value="">Choose a term</option>
              {keyTerms.map((entry, index) => <option key={`${entry.term}-${index}`} value={entry.term}>{entry.term}</option>)}
            </select>
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