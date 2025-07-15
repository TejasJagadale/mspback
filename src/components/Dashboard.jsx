import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/dashboard.css";

const Dashboard = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const userData = JSON.parse(localStorage.getItem("userData"));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showBookModal, setShowBookModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
    description: "",
    cover_image: null
  });
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    venue: "",
    coordinator: "",
    special_participant: "",
    entry_type: "",
    map: "",
    eventImage: null
  });
  // Add function to reset form
  const resetEventForm = () => {
    setEventForm({
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      venue: "",
      coordinator: "",
      special_participant: "",
      entry_type: "",
      map: "",
      eventImage: null
    });
    setEditingEvent(null);
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [books, setBooks] = useState([]);
  const [events, setEvents] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalEvents: 0,
    upcomingEvents: 0
  });

  const fetchBooks = async () => {
    setListLoading(true);
    try {
      const response = await axios.get(
        "http://makalukaga-prod.mpeoplesnet.com/api/user/book/list",
        {
          headers: {
            Authorization: `${localStorage.getItem("authToken")}`
          }
        }
      );
      setBooks(response.data.data || []);
      setStats((prev) => ({
        ...prev,
        totalBooks: response.data.data?.length || 0
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching books");
      console.error("Fetch books error:", err);
    } finally {
      setListLoading(false);
    }
  };

  const fetchEvents = async () => {
    setListLoading(true);
    try {
      const response = await axios.get(
        "http://makalukaga-prod.mpeoplesnet.com/api/user/event/list",
        {
          headers: {
            Authorization: `${localStorage.getItem("authToken")}`
          }
        }
      );
      const eventsData = response.data.data || [];
      setEvents(eventsData);

      // Calculate upcoming events
      const upcoming = eventsData.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate > new Date();
      });

      setStats((prev) => ({
        ...prev,
        totalEvents: eventsData.length,
        upcomingEvents: upcoming.length
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching events");
      console.error("Fetch events error:", err);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "list-books") {
      fetchBooks();
    } else if (activeTab === "list-events") {
      fetchEvents();
    }
  }, [activeTab]);

  useEffect(() => {
    // Initial data load
    fetchBooks();
    fetchEvents();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
    navigate("/login");
  };

  const handleBookInputChange = (e) => {
    const { name, value } = e.target;
    setBookForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEventInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBookImageUpload = (e) => {
    setBookForm((prev) => ({ ...prev, cover_image: e.target.files[0] }));
  };

  // const handleEventImageUpload = (e) => {
  //   setEventForm((prev) => ({ ...prev, eventImage: e.target.files[0] }));
  // };

  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", bookForm.title);
      formData.append("author", bookForm.author);
      formData.append("description", bookForm.description);
      formData.append("cover_image", bookForm.cover_image);

      const response = await axios.post(
        "http://makalukaga-prod.mpeoplesnet.com/api/admin/book/add",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.data.status) {
        alert("Book added successfully!");
        setShowBookModal(false);
        setBookForm({
          title: "",
          author: "",
          description: "",
          cover_image: null
        });
        fetchBooks(); // Refresh the book list
      } else {
        setError(response.data.message || "Failed to add book");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error adding book");
      console.error("Add book error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", eventForm.title);
      formData.append("description", eventForm.description);
      formData.append("date", eventForm.date.split("T")[0]);
      formData.append("time", eventForm.date.split("T")[1] || "00:00");
      formData.append("location", eventForm.location);
      formData.append("venue", eventForm.venue);
      formData.append("coordinator", eventForm.coordinator);
      formData.append("special_participant", eventForm.special_participant);
      formData.append("entry_type", eventForm.entry_type);
      formData.append("map", eventForm.map);
      if (eventForm.eventImage) {
        formData.append("eventImage", eventForm.eventImage);
      }
      console.log(editingEvent);

      console.log(editingEvent.id);

      let response;
      if (editingEvent) {
        // Update existing event
        response = await axios.put(
          `http://makalukaga-prod.mpeoplesnet.com/api/admin/event/update/${editingEvent.id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `${localStorage.getItem("authToken")}`
            }
          }
        );
      } else {
        // Create new event
        response = await axios.post(
          "http://makalukaga-prod.mpeoplesnet.com/api/admin/event/add",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `${localStorage.getItem("authToken")}`
            }
          }
        );
      }

      if (response.data.status) {
        alert(`Event ${editingEvent ? "updated" : "added"} successfully!`);
        setShowEventModal(false);
        resetEventForm();
        fetchEvents(); // Refresh the event list
      } else {
        setError(
          response.data.message ||
            `Failed to ${editingEvent ? "update" : "add"} event`
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Error ${editingEvent ? "updating" : "adding"} event`
      );
      console.error("Event error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    // Convert the event date to datetime-local format (YYYY-MM-DDTHH:MM)
    const eventDate = new Date(event.date);
    const formattedDate = `${eventDate.getFullYear()}-${String(
      eventDate.getMonth() + 1
    ).padStart(2, "0")}-${String(eventDate.getDate()).padStart(
      2,
      "0"
    )}T${String(eventDate.getHours()).padStart(2, "0")}:${String(
      eventDate.getMinutes()
    ).padStart(2, "0")}`;

    setEventForm({
      title: event.title,
      description: event.description,
      date: formattedDate,
      time: event.time,
      location: event.location,
      venue: event.venue,
      coordinator: event.coordinator,
      special_participant: event.special_participant,
      entry_type: event.entry_type,
      map: event.map,
      eventImage: null // We don't pre-fill the image to avoid issues
    });
    setShowEventModal(true);
  };

  const deleteBook = async (bookId) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;

    try {
      const response = await axios.delete(
        `http://makalukaga-prod.mpeoplesnet.com/api/admin/book/delete/${bookId}`,
        {
          headers: {
            Authorization: `${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.data.status) {
        alert("Book deleted successfully!");
        fetchBooks();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting book");
      console.error("Delete book error:", err);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      const response = await axios.delete(
        `http://makalukaga-prod.mpeoplesnet.com/api/admin/event/delete/${eventId}`,
        {
          headers: {
            Authorization: `${localStorage.getItem("authToken")}`
          }
        }
      );

      if (response.data.status) {
        alert("Event deleted successfully!");
        fetchEvents();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error deleting event");
      console.error("Delete event error:", err);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <h2>Makalu Kaga</h2>
          <p>Admin Dashboard</p>
        </div>

        <div className="user-profile">
          <div className="avatar">
            {userData?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <h4>{userData?.name}</h4>
            <p>Administrator</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          <ul>
            <li
              className={activeTab === "dashboard" ? "active" : ""}
              onClick={() => {
                setActiveTab("dashboard");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </li>
            <li
              className={activeTab === "add-books" ? "active" : ""}
              onClick={() => {
                setActiveTab("add-books");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-book"></i>
              <span>Add Books</span>
            </li>
            <li
              className={activeTab === "add-events" ? "active" : ""}
              onClick={() => {
                setActiveTab("add-events");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-calendar-plus"></i>
              <span>Add Events</span>
            </li>
            <li
              className={activeTab === "list-books" ? "active" : ""}
              onClick={() => {
                setActiveTab("list-books");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-book-open"></i>
              <span>Manage Books</span>
            </li>
            <li
              className={activeTab === "list-events" ? "active" : ""}
              onClick={() => {
                setActiveTab("list-events");
                setSidebarOpen(false);
              }}
            >
              <i className="fas fa-calendar-alt"></i>
              <span>Manage Events</span>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>

      <div
        className={`sidebar-overlay ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Main Content */}
      <div className="main-content">
        {/* Top Navigation */}
        <header className="top-nav">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <div className="breadcrumbs">
            <span>Dashboard</span>
            {activeTab !== "dashboard" && (
              <span> / {activeTab.replace("-", " ")}</span>
            )}
          </div>
          <div className="user-actions">
            <span className="welcome-msg">Welcome, {userData?.name}</span>
            <button className="notifications">
              <i className="fas fa-bell"></i>
              <span className="badge">3</span>
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="content-area">
          {activeTab === "dashboard" && (
            <div className="dashboard-overview">
              <h2>Overview</h2>

              <div className="stats-cards">
                <div className="stat-card">
                  <div className="stat-icon bg-primary">
                    <i className="fas fa-book"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalBooks}</h3>
                    <p>Total Books</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-success">
                    <i className="fas fa-calendar"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalEvents}</h3>
                    <p>Total Events</p>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon bg-warning">
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.upcomingEvents}</h3>
                    <p>Upcoming Events</p>
                  </div>
                </div>
              </div>

              <div className="recent-activity">
                <div className="recent-books">
                  <h3>Recent Books</h3>
                  {books.slice(0, 3).map((book) => (
                    <div key={book.id} className="activity-item">
                      <div className="activity-icon">
                        <i className="fas fa-book"></i>
                      </div>
                      <div className="activity-details">
                        <h4>{book.title}</h4>
                        <p>By {book.author}</p>
                        <span className="activity-time">Added recently</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="upcoming-events">
                  <h3>Upcoming Events</h3>
                  {events
                    .filter((event) => new Date(event.date) > new Date())
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="activity-item">
                        <div className="activity-icon">
                          <i className="fas fa-calendar-day"></i>
                        </div>
                        <div className="activity-details">
                          <h4>{event.title}</h4>
                          <p>
                            {event.location} •{" "}
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                          <span className="activity-time">
                            {event.entry_type}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "add-books" && (
            <div className="add-section">
              <div className="section-header">
                <h2>Add New Book</h2>
                <button
                  className="btn-primary"
                  onClick={() => setShowBookModal(true)}
                >
                  <i className="fas fa-plus"></i> Add Book
                </button>
              </div>

              <div className="quick-stats">
                <p>You have added {stats.totalBooks} books so far.</p>
              </div>
            </div>
          )}

          {activeTab === "add-events" && (
            <div className="add-section">
              <div className="section-header">
                <h2>Add New Event</h2>
                <button
                  className="btn-primary"
                  onClick={() => setShowEventModal(true)}
                >
                  <i className="fas fa-plus"></i> Add Event
                </button>
              </div>

              <div className="quick-stats">
                <p>
                  You have {stats.upcomingEvents} upcoming events out of{" "}
                  {stats.totalEvents} total.
                </p>
              </div>
            </div>
          )}

          {activeTab === "list-books" && (
            <div className="list-section">
              <div className="section-header">
                <h2>Manage Books</h2>
                <div className="search-box">
                  <input type="text" placeholder="Search books..." />
                  <button className="search-btn">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>

              {listLoading ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i> Loading books...
                </div>
              ) : error ? (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              ) : books.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-book-open"></i>
                  <p>No books found. Add your first book!</p>
                </div>
              ) : (
                <div className="data-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Cover</th>
                        <th>Title</th>
                        <th>Author</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {books.map((book) => (
                        <tr key={book.id}>
                          <td>
                            {book.cover_image && (
                              <img
                                src={book.cover_image}
                                alt={book.title}
                                className="thumbnail"
                              />
                            )}
                          </td>
                          <td>{book.title}</td>
                          <td>{book.author}</td>
                          <td className="truncate">
                            {book.description.substring(0, 50)}...
                          </td>
                          <td>
                            <button className="btn-edit">
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => deleteBook(book.id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "list-events" && (
            <div className="list-section">
              <div className="section-header">
                <h2>Manage Events</h2>
                <div className="search-box">
                  <input type="text" placeholder="Search events..." />
                  <button className="search-btn">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>

              {listLoading ? (
                <div className="loading-spinner">
                  <i className="fas fa-spinner fa-spin"></i> Loading events...
                </div>
              ) : error ? (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              ) : events.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-calendar-times"></i>
                  <p>No events found. Add your first event!</p>
                </div>
              ) : (
                <div className="data-grid">
                  {events.map((event) => (
                    <div key={event.id} className="event-card">
                      <div className="event-image">
                        {event.eventImage ? (
                          <img src={event.eventImage} alt={event.title} />
                        ) : (
                          <div className="image-placeholder">
                            <i className="fas fa-calendar-day"></i>
                          </div>
                        )}
                        <span
                          className={`event-badge ${
                            event.entry_type === "Invite Only"
                              ? "badge-warning"
                              : "badge-success"
                          }`}
                        >
                          {event.entry_type}
                        </span>
                      </div>
                      <div className="event-details">
                        <h3>{event.title}</h3>
                        <p className="event-date">
                          <i className="fas fa-clock"></i>{" "}
                          {new Date(event.date).toLocaleString()}
                        </p>
                        <p className="event-location">
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {event.location}
                        </p>
                        <p className="event-description truncate">
                          {event.description.substring(0, 100)}...
                        </p>
                        <div className="event-actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEditEvent(event)}
                          >
                            <i className="fas fa-edit"></i> Edit
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <i className="fas fa-trash"></i> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Book Modal */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Book</h3>
              <button
                className="close-button"
                onClick={() => setShowBookModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              <form onSubmit={handleBookSubmit}>
                <div className="form-group">
                  <label>Title</label>
                  <input
                    type="text"
                    name="title"
                    value={bookForm.title}
                    onChange={handleBookInputChange}
                    placeholder="Enter book title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Author</label>
                  <input
                    type="text"
                    name="author"
                    value={bookForm.author}
                    onChange={handleBookInputChange}
                    placeholder="Enter author name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={bookForm.description}
                    onChange={handleBookInputChange}
                    placeholder="Enter book description"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Cover Image</label>
                  <div className="file-upload">
                    <label className="upload-btn">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleBookImageUpload}
                        required
                      />
                      <span>
                        {bookForm.cover_image
                          ? bookForm.cover_image.name
                          : "Choose file..."}
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowBookModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showEventModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add New Event</h3>
              <button
                className="close-button"
                onClick={() => setShowEventModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="alert alert-error">
                  <i className="fas fa-exclamation-circle"></i> {error}
                </div>
              )}

              <form onSubmit={handleEventSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Event Title</label>
                    <input
                      type="text"
                      name="title"
                      value={eventForm.title}
                      onChange={handleEventInputChange}
                      placeholder="Enter event title"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Date & Time</label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={eventForm.date}
                      onChange={handleEventInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={eventForm.description}
                    onChange={handleEventInputChange}
                    placeholder="Enter event description"
                    rows="4"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      name="location"
                      value={eventForm.location}
                      onChange={handleEventInputChange}
                      placeholder="Enter location"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Venue</label>
                    <input
                      type="text"
                      name="venue"
                      value={eventForm.venue}
                      onChange={handleEventInputChange}
                      placeholder="Enter venue"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Coordinator</label>
                    <input
                      type="text"
                      name="coordinator"
                      value={eventForm.coordinator}
                      onChange={handleEventInputChange}
                      placeholder="Enter coordinator name"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Special Participant</label>
                    <input
                      type="text"
                      name="special_participant"
                      value={eventForm.special_participant}
                      onChange={handleEventInputChange}
                      placeholder="Enter special participant"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Entry Type</label>
                    <select
                      name="entry_type"
                      value={eventForm.entry_type}
                      onChange={handleEventInputChange}
                      required
                    >
                      <option value="">Select Entry Type</option>
                      <option value="Invite Only">Invite Only</option>
                      <option value="Open to Public">Open to Public</option>
                      <option value="Registered Users">Registered Users</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Map URL</label>
                    <input
                      type="url"
                      name="map"
                      value={eventForm.map}
                      onChange={handleEventInputChange}
                      placeholder="https://maps.google.com/..."
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEventModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save"></i> Submit
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
