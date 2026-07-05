import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedItem = useMemo(() => {
    if (!selectedSource) {
      return null;
    }

    if (selectedSource.type === "note") {
      return notes.find((note) => note.id === selectedSource.id) || null;
    }

    return documents.find((document) => document.id === selectedSource.id) || null;
  }, [documents, notes, selectedSource]);

  const selectedChatKey = selectedSource
    ? `${selectedSource.type}-${selectedSource.id}`
    : "";

  const selectedChatMessages = selectedChatKey
    ? chatMessages[selectedChatKey] || []
    : [];

  async function fetchNotes() {
    try {
      const response = await fetch(`${API_URL}/notes`);

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setNotes(data);

      if (!selectedSource && data.length > 0) {
        setSelectedSource({ type: "note", id: data[0].id });
      }
    } catch (error) {
      setMessage("Could not fetch notes.");
    }
  }

  async function fetchDocuments() {
    try {
      const response = await fetch(`${API_URL}/documents`);

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      setMessage("Could not fetch documents.");
    }
  }

  async function refreshSources() {
    await Promise.all([fetchNotes(), fetchDocuments()]);
  }

  async function createNote(event) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setMessage("Title and content are required.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create note");
      }

      const newNote = await response.json();

      setTitle("");
      setContent("");
      setMessage("Note created successfully.");
      setSelectedSource({ type: "note", id: newNote.id });
      fetchNotes();
    } catch (error) {
      setMessage("Could not create note.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadPdf(event) {
    event.preventDefault();

    if (!pdfFile) {
      setMessage("Please choose a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);

    setUploadLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/documents/upload-pdf`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload PDF");
      }

      const newDocument = await response.json();

      setPdfFile(null);
      setMessage("PDF uploaded successfully.");
      setSelectedSource({ type: "document", id: newDocument.id });
      fetchDocuments();
    } catch (error) {
      setMessage("Could not upload PDF.");
    } finally {
      setUploadLoading(false);
    }
  }

  function addMessageToSource(sourceKey, newMessage) {
    setChatMessages((previousMessages) => ({
      ...previousMessages,
      [sourceKey]: [...(previousMessages[sourceKey] || []), newMessage],
    }));
  }

  async function sendChatMessage(event, quickPrompt = "") {
    event.preventDefault();

    if (!selectedSource || !selectedItem) {
      setMessage("Please select a note or document first.");
      return;
    }

    const userMessage = quickPrompt || chatInput.trim();

    if (!userMessage) {
      return;
    }

    setChatInput("");
    setMessage("");
    setChatLoading(true);

    addMessageToSource(selectedChatKey, {
      role: "user",
      text: userMessage,
    });

    const endpoint =
      selectedSource.type === "note"
        ? `${API_URL}/notes/${selectedSource.id}/chat`
        : `${API_URL}/documents/${selectedSource.id}/chat`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to chat with selected source");
      }

      const data = await response.json();

      addMessageToSource(selectedChatKey, {
        role: "assistant",
        text: data.answer,
      });
    } catch (error) {
      addMessageToSource(selectedChatKey, {
        role: "assistant",
        text: "Sorry, I could not answer this message.",
      });
    } finally {
      setChatLoading(false);
    }
  }

  function quickAsk(prompt) {
    if (!selectedSource || !selectedItem) {
      return;
    }

    const fakeEvent = {
      preventDefault: () => {},
    };

    sendChatMessage(fakeEvent, prompt);
  }

  useEffect(() => {
    refreshSources();
  }, []);

  return (
    <main className="app chat-app">
      <section className="hero">
        <h1>AI Study Assistant</h1>
        <p>Select a note or PDF and chat with your study material.</p>
      </section>

      <section className="card create-note-card">
        <h2>Create Note</h2>

        <form onSubmit={createNote} className="note-form">
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <textarea
            placeholder="Write your study note here..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Note"}
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </section>

      <section className="chat-layout">
        <aside className="notes-sidebar card">
          <div className="section-header">
            <h2>Sources</h2>
            <button className="secondary-button" onClick={refreshSources}>
              Refresh
            </button>
          </div>

          <form onSubmit={uploadPdf} className="pdf-upload-form">
            <label htmlFor="pdf-upload">Upload PDF</label>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={(event) => setPdfFile(event.target.files[0] || null)}
            />
            <button type="submit" disabled={uploadLoading}>
              {uploadLoading ? "Uploading..." : "Upload PDF"}
            </button>
          </form>

          <div className="source-section">
            <h3>Notes</h3>

            {notes.length === 0 ? (
              <p className="empty-text">No notes yet.</p>
            ) : (
              <div className="note-list-compact">
                {notes.map((note) => (
                  <button
                    key={`note-${note.id}`}
                    type="button"
                    className={
                      selectedSource?.type === "note" && selectedSource.id === note.id
                        ? "note-list-item active"
                        : "note-list-item"
                    }
                    onClick={() => setSelectedSource({ type: "note", id: note.id })}
                  >
                    <strong>{note.title}</strong>
                    <span>Note ID: {note.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="source-section">
            <h3>Documents</h3>

            {documents.length === 0 ? (
              <p className="empty-text">No PDFs yet.</p>
            ) : (
              <div className="note-list-compact">
                {documents.map((document) => (
                  <button
                    key={`document-${document.id}`}
                    type="button"
                    className={
                      selectedSource?.type === "document" &&
                      selectedSource.id === document.id
                        ? "note-list-item active"
                        : "note-list-item"
                    }
                    onClick={() =>
                      setSelectedSource({ type: "document", id: document.id })
                    }
                  >
                    <strong>{document.filename}</strong>
                    <span>PDF ID: {document.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="chat-panel card">
          {selectedItem && selectedSource ? (
            <>
              <div className="chat-panel-header">
                <div>
                  <span className="source-type-badge">
                    {selectedSource.type === "note" ? "Note" : "PDF Document"}
                  </span>
                  <h2>
                    {selectedSource.type === "note"
                      ? selectedItem.title
                      : selectedItem.filename}
                  </h2>
                  <p>{selectedItem.content}</p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() => quickAsk("Bu materyali basit Türkçe ile özetle.")}
                  disabled={chatLoading}
                >
                  Summarize
                </button>
                <button
                  type="button"
                  onClick={() =>
                    quickAsk("Bu materyalden cevaplarıyla birlikte 5 quiz sorusu hazırla.")
                  }
                  disabled={chatLoading}
                >
                  Generate Quiz
                </button>
                <button
                  type="button"
                  onClick={() => quickAsk("Bu materyali yeni başlayan biri için basitçe açıkla.")}
                  disabled={chatLoading}
                >
                  Explain Simply
                </button>
              </div>

              <div className="chat-messages">
                {selectedChatMessages.length === 0 ? (
                  <div className="empty-chat">
                    Ask a question about this material, or use a quick action.
                  </div>
                ) : (
                  selectedChatMessages.map((chatMessage, index) => (
                    <div
                      key={`${chatMessage.role}-${index}`}
                      className={
                        chatMessage.role === "user"
                          ? "chat-message user-message"
                          : "chat-message assistant-message"
                      }
                    >
                      <span>{chatMessage.role === "user" ? "You" : "AI"}</span>
                      <p>{chatMessage.text}</p>
                    </div>
                  ))
                )}

                {chatLoading && (
                  <div className="chat-message assistant-message">
                    <span>AI</span>
                    <p>Thinking...</p>
                  </div>
                )}
              </div>

              <form onSubmit={sendChatMessage} className="chat-input-form">
                <input
                  type="text"
                  placeholder="Ask something about this material..."
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  disabled={chatLoading}
                />
                <button type="submit" disabled={chatLoading}>
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="empty-chat-panel">
              <h2>No source selected</h2>
              <p>Create a note, upload a PDF, or select an existing source.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;