import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selectedNote = useMemo(() => {
    return notes.find((note) => note.id === selectedNoteId) || null;
  }, [notes, selectedNoteId]);

  const selectedChatMessages = selectedNote
    ? chatMessages[selectedNote.id] || []
    : [];

  async function fetchNotes() {
    try {
      const response = await fetch(`${API_URL}/notes`);

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const data = await response.json();
      setNotes(data);

      if (data.length > 0 && selectedNoteId === null) {
        setSelectedNoteId(data[0].id);
      }
    } catch (error) {
      setMessage("Could not fetch notes.");
    }
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
      setSelectedNoteId(newNote.id);
      fetchNotes();
    } catch (error) {
      setMessage("Could not create note.");
    } finally {
      setLoading(false);
    }
  }

  function addMessageToNote(noteId, newMessage) {
    setChatMessages((previousMessages) => ({
      ...previousMessages,
      [noteId]: [...(previousMessages[noteId] || []), newMessage],
    }));
  }

  async function sendChatMessage(event) {
    event.preventDefault();

    if (!selectedNote) {
      setMessage("Please select a note first.");
      return;
    }

    if (!chatInput.trim()) {
      return;
    }

    const userMessage = chatInput.trim();
    setChatInput("");
    setMessage("");
    setChatLoading(true);

    addMessageToNote(selectedNote.id, {
      role: "user",
      text: userMessage,
    });

    try {
      const response = await fetch(`${API_URL}/notes/${selectedNote.id}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to chat with note");
      }

      const data = await response.json();

      addMessageToNote(selectedNote.id, {
        role: "assistant",
        text: data.answer,
      });
    } catch (error) {
      addMessageToNote(selectedNote.id, {
        role: "assistant",
        text: "Sorry, I could not answer this message.",
      });
    } finally {
      setChatLoading(false);
    }
  }

  async function quickAsk(prompt) {
    if (!selectedNote) {
      return;
    }

    setChatInput(prompt);

    const fakeEvent = {
      preventDefault: () => {},
    };

    setTimeout(() => {
      sendChatMessage(fakeEvent);
    }, 0);
  }

  useEffect(() => {
    fetchNotes();
  }, []);

  return (
    <main className="app chat-app">
      <section className="hero">
        <h1>AI Study Assistant</h1>
        <p>Select a note and chat with your study material.</p>
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
            <h2>Notes</h2>
            <button className="secondary-button" onClick={fetchNotes}>
              Refresh
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="empty-text">No notes yet.</p>
          ) : (
            <div className="note-list-compact">
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  className={
                    note.id === selectedNoteId
                      ? "note-list-item active"
                      : "note-list-item"
                  }
                  onClick={() => setSelectedNoteId(note.id)}
                >
                  <strong>{note.title}</strong>
                  <span>ID: {note.id}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="chat-panel card">
          {selectedNote ? (
            <>
              <div className="chat-panel-header">
                <div>
                  <h2>{selectedNote.title}</h2>
                  <p>{selectedNote.content}</p>
                </div>
              </div>

              <div className="quick-actions">
                <button
                  type="button"
                  onClick={() => quickAsk("Summarize this note in simple language.")}
                  disabled={chatLoading}
                >
                  Summarize
                </button>
                <button
                  type="button"
                  onClick={() => quickAsk("Generate 5 quiz questions from this note with answers.")}
                  disabled={chatLoading}
                >
                  Generate Quiz
                </button>
                <button
                  type="button"
                  onClick={() => quickAsk("Explain this note like I am a beginner.")}
                  disabled={chatLoading}
                >
                  Explain Simply
                </button>
              </div>

              <div className="chat-messages">
                {selectedChatMessages.length === 0 ? (
                  <div className="empty-chat">
                    Ask a question about this note, or use a quick action.
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
                  placeholder="Ask something about this note..."
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
              <h2>No note selected</h2>
              <p>Create or select a note to start chatting.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;