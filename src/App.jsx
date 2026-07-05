import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [folders, setFolders] = useState([]);
  const [notes, setNotes] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pdfFile, setPdfFile] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState({});
  const [loading, setLoading] = useState(false);
  const [folderLoading, setFolderLoading] = useState(false);
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

  const folderOptions = [
    { id: "", name: "Uncategorized" },
    ...folders.map((folder) => ({ id: String(folder.id), name: folder.name })),
  ];

  function getFolderItems(folderId) {
    return {
      notes: notes.filter((note) => (note.folder_id || null) === folderId),
      documents: documents.filter((document) => (document.folder_id || null) === folderId),
    };
  }

  async function fetchFolders() {
    try {
      const response = await fetch(`${API_URL}/folders`);

      if (!response.ok) {
        throw new Error("Failed to fetch folders");
      }

      const data = await response.json();
      setFolders(data);
    } catch (error) {
      setMessage("Could not fetch folders.");
    }
  }

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
    await Promise.all([fetchFolders(), fetchNotes(), fetchDocuments()]);
  }

  async function createFolder(event) {
    event.preventDefault();

    if (!newFolderName.trim()) {
      setMessage("Folder name is required.");
      return;
    }

    setFolderLoading(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create folder");
      }

      const newFolder = await response.json();

      setNewFolderName("");
      setSelectedFolderId(String(newFolder.id));
      setMessage("Folder created successfully.");
      fetchFolders();
    } catch (error) {
      setMessage("Could not create folder.");
    } finally {
      setFolderLoading(false);
    }
  }

  async function deleteFolder(folderId) {
    const shouldDelete = window.confirm(
      "Delete this folder? Notes and PDFs inside it will move to Uncategorized."
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/folders/${folderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete folder");
      }

      setMessage("Folder deleted successfully.");
      setSelectedFolderId("");
      refreshSources();
    } catch (error) {
      setMessage("Could not delete folder.");
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

    const folderId = selectedFolderId ? Number(selectedFolderId) : null;

    try {
      const response = await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          content,
          folder_id: folderId,
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

    const folderId = selectedFolderId ? Number(selectedFolderId) : null;
    const formData = new FormData();
    formData.append("file", pdfFile);

    if (folderId !== null) {
      formData.append("folder_id", folderId);
    }

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

  async function deleteNote(noteId) {
    const shouldDelete = window.confirm("Delete this note?");

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      setNotes((previousNotes) => previousNotes.filter((note) => note.id !== noteId));
      setChatMessages((previousMessages) => {
        const updatedMessages = { ...previousMessages };
        delete updatedMessages[`note-${noteId}`];
        return updatedMessages;
      });

      if (selectedSource?.type === "note" && selectedSource.id === noteId) {
        setSelectedSource(null);
      }

      setMessage("Note deleted successfully.");
    } catch (error) {
      setMessage("Could not delete note.");
    }
  }

  async function deleteDocument(documentId) {
    const shouldDelete = window.confirm("Delete this PDF document?");

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      setDocuments((previousDocuments) =>
        previousDocuments.filter((document) => document.id !== documentId)
      );
      setChatMessages((previousMessages) => {
        const updatedMessages = { ...previousMessages };
        delete updatedMessages[`document-${documentId}`];
        return updatedMessages;
      });

      if (selectedSource?.type === "document" && selectedSource.id === documentId) {
        setSelectedSource(null);
      }

      setMessage("PDF deleted successfully.");
    } catch (error) {
      setMessage("Could not delete PDF.");
    }
  }

  function handleDragStart(event, sourceType, sourceId) {
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({
        type: sourceType,
        id: sourceId,
      })
    );
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  async function moveSourceToFolder(source, targetFolderId) {
    const folderId = targetFolderId === null ? null : Number(targetFolderId);

    try {
      if (source.type === "note") {
        const note = notes.find((currentNote) => currentNote.id === source.id);

        if (!note) {
          throw new Error("Note not found");
        }

        const response = await fetch(`${API_URL}/notes/${source.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: note.title,
            content: note.content,
            folder_id: folderId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to move note");
        }
      }

      if (source.type === "document") {
        const response = await fetch(`${API_URL}/documents/${source.id}/folder`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folder_id: folderId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to move PDF");
        }
      }

      setMessage("Source moved successfully.");
      refreshSources();
    } catch (error) {
      setMessage("Could not move source.");
    }
  }

  function handleDrop(event, targetFolderId) {
    event.preventDefault();

    const dragData = event.dataTransfer.getData("application/json");

    if (!dragData) {
      return;
    }

    const source = JSON.parse(dragData);
    moveSourceToFolder(source, targetFolderId);
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
        <div className="hero-badge">Local AI Study Workspace</div>
        <h1>AI Study Assistant</h1>
        <p>Create notes, upload PDFs, organize folders, and chat with your study materials.</p>
        <div className="hero-stats">
          <div>
            <strong>{notes.length}</strong>
            <span>Saved Notes</span>
          </div>
          <div>
            <strong>{documents.length}</strong>
            <span>PDF Documents</span>
          </div>
          <div>
            <strong>{folders.length}</strong>
            <span>Folders</span>
          </div>
          <div>
            <strong>Local</strong>
            <span>Ollama AI</span>
          </div>
        </div>
      </section>

      <section className="card create-note-card">
        <div className="section-title-row">
          <div>
            <span className="eyebrow">New material</span>
            <h2>Create Note</h2>
          </div>
        </div>

        <form onSubmit={createNote} className="note-form">
          <input
            type="text"
            placeholder="Note title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />

          <select
            value={selectedFolderId}
            onChange={(event) => setSelectedFolderId(event.target.value)}
          >
            {folderOptions.map((folder) => (
              <option key={`option-${folder.id || "uncategorized"}`} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>

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
            <div>
              <span className="eyebrow">Library</span>
              <h2>Sources</h2>
            </div>
            <button className="secondary-button" onClick={refreshSources}>
              Refresh
            </button>
          </div>

          <form onSubmit={createFolder} className="folder-form">
            <label htmlFor="folder-name">Create Folder</label>
            <div>
              <input
                id="folder-name"
                type="text"
                placeholder="e.g. Mathematics"
                value={newFolderName}
                onChange={(event) => setNewFolderName(event.target.value)}
              />
              <button type="submit" disabled={folderLoading}>
                {folderLoading ? "..." : "+"}
              </button>
            </div>
          </form>

          <form onSubmit={uploadPdf} className="pdf-upload-form">
            <label htmlFor="pdf-upload">Upload PDF</label>
            <select
              value={selectedFolderId}
              onChange={(event) => setSelectedFolderId(event.target.value)}
            >
              {folderOptions.map((folder) => (
                <option key={`pdf-option-${folder.id || "uncategorized"}`} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
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

          <div className="folders-list">
            <div className="source-section-title">
              <h3>Folders</h3>
              <span>{folders.length + 1}</span>
            </div>

            {[...folders, { id: null, name: "Uncategorized" }].map((folder) => {
              const folderId = folder.id || null;
              const folderItems = getFolderItems(folderId);
              const totalItems = folderItems.notes.length + folderItems.documents.length;

              return (
                <div
                  key={`folder-${folder.id || "uncategorized"}`}
                  className="folder-group"
                  onDragOver={handleDragOver}
                  onDrop={(event) => handleDrop(event, folderId)}
                >
                  <div className="folder-header-row">
                    <div>
                      <strong>{folder.name}</strong>
                      <span>{totalItems} items</span>
                    </div>

                    {folder.id && (
                      <button
                        type="button"
                        className="delete-folder-button"
                        onClick={() => deleteFolder(folder.id)}
                        aria-label={`Delete ${folder.name}`}
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {totalItems === 0 ? (
                    <p className="empty-folder-text">No sources here.</p>
                  ) : (
                    <div className="note-list-compact">
                      {folderItems.notes.map((note) => (
                        <div
                          key={`note-${note.id}`}
                          draggable
                          onDragStart={(event) => handleDragStart(event, "note", note.id)}
                          className={
                            selectedSource?.type === "note" && selectedSource.id === note.id
                              ? "source-card active draggable-source"
                              : "source-card draggable-source"
                          }
                        >
                          <button
                            type="button"
                            className="source-main-button"
                            onClick={() => setSelectedSource({ type: "note", id: note.id })}
                          >
                            <strong>{note.title}</strong>
                            <span>Note ID: {note.id}</span>
                          </button>

                          <button
                            type="button"
                            className="delete-source-button"
                            onClick={() => deleteNote(note.id)}
                            aria-label={`Delete ${note.title}`}
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      {folderItems.documents.map((document) => (
                        <div
                          key={`document-${document.id}`}
                          draggable
                          onDragStart={(event) => handleDragStart(event, "document", document.id)}
                          className={
                            selectedSource?.type === "document" &&
                            selectedSource.id === document.id
                              ? "source-card active draggable-source"
                              : "source-card draggable-source"
                          }
                        >
                          <button
                            type="button"
                            className="source-main-button"
                            onClick={() =>
                              setSelectedSource({ type: "document", id: document.id })
                            }
                          >
                            <strong>{document.filename}</strong>
                            <span>PDF ID: {document.id}</span>
                          </button>

                          <button
                            type="button"
                            className="delete-source-button"
                            onClick={() => deleteDocument(document.id)}
                            aria-label={`Delete ${document.filename}`}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
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
                  onClick={() => quickAsk("Summarize this material clearly in simple English.")}
                  disabled={chatLoading}
                >
                  Summarize
                </button>
                <button
                  type="button"
                  onClick={() =>
                    quickAsk("Create 5 quiz questions with answers based on this material.")
                  }
                  disabled={chatLoading}
                >
                  Generate Quiz
                </button>
                <button
                  type="button"
                  onClick={() => quickAsk("Explain this material in simple English for a beginner.")}
                  disabled={chatLoading}
                >
                  Explain Simply
                </button>
              </div>

              <div className="chat-messages">
                {selectedChatMessages.length === 0 ? (
                  <div className="empty-chat empty-chat-rich">
                    <span className="empty-chat-icon">✨</span>
                    <h3>Start studying with this source</h3>
                    <p>Ask a question, summarize the material, or generate practice questions.</p>

                    <div className="empty-feature-grid">
                      <div>
                        <strong>Ask</strong>
                        <span>Chat with the selected note or PDF.</span>
                      </div>
                      <div>
                        <strong>Summarize</strong>
                        <span>Get a short and simple overview.</span>
                      </div>
                      <div>
                        <strong>Quiz</strong>
                        <span>Create quick practice questions.</span>
                      </div>
                    </div>
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
            <div className="empty-chat-panel empty-chat-panel-rich">
              <span className="empty-chat-icon">📚</span>
              <h2>No source selected</h2>
              <p>Create a note, upload a PDF, or select an existing source to start chatting.</p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default App;