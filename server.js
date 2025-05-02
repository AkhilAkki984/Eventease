const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/eventease')
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => console.error('❌ MongoDB connection error:', err.message));

// Event Schema and Model
const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, required: true },
  addressLink: { type: String, default: '' },
  image: { type: String, default: '' },
  ticketPrice: { type: Number, default: 0 },
  peopleLimit: { type: String, default: '' },
  visibility: { type: String, default: 'public' },
  accessCode: { type: String, default: '' }
});

const Event = mongoose.model('Event', eventSchema);

// Routes

// Serve the homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all events
app.get('/events', async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching events' });
  }
});

// Add a new event (form submission)
app.post('/addevent', async (req, res) => {
  try {
    const { title, description, date, time, location, type, addressLink, ticketPrice, peopleLimit, visibility, accessCode } = req.body;
    if (!title || !description || !date || !time || !location || !type) {
      return res.status(400).send('Required fields are missing');
    }
    const newEvent = new Event({ 
      title, 
      description, 
      date, 
      time, 
      location, 
      type, 
      addressLink: addressLink || '', 
      ticketPrice: ticketPrice || 0, 
      peopleLimit: peopleLimit || '', 
      visibility: visibility || 'public', 
      accessCode: accessCode || '' 
    });
    await newEvent.save();
    res.redirect('/');
  } catch (error) {
    res.status(500).send('Error saving event');
  }
});

// Add a new event (API for AJAX)
app.post('/events', async (req, res) => {
  try {
    const { title, description, date, time, location, type, addressLink, ticketPrice, peopleLimit, visibility, accessCode } = req.body;
    if (!title || !description || !date || !time || !location || !type) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    const newEvent = new Event({ 
      title, 
      description, 
      date, 
      time, 
      location, 
      type, 
      addressLink: addressLink || '', 
      ticketPrice: ticketPrice || 0, 
      peopleLimit: peopleLimit || '', 
      visibility: visibility || 'public', 
      accessCode: accessCode || '' 
    });
    await newEvent.save();
    res.status(201).json({ message: 'Event added successfully', event: newEvent });
  } catch (error) {
    res.status(500).json({ error: 'Error adding event' });
  }
});

// Update an event
app.put('/events/:id', async (req, res) => {
  try {
    const { title, description, date, time, location, type, addressLink, ticketPrice, peopleLimit, visibility, accessCode } = req.body;
    if (!title || !description || !date || !time || !location || !type) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { 
        title, 
        description, 
        date, 
        time, 
        location, 
        type, 
        addressLink: addressLink || '', 
        ticketPrice: ticketPrice || 0, 
        peopleLimit: peopleLimit || '', 
        visibility: visibility || 'public', 
        accessCode: accessCode || '' 
      },
      { new: true }
    );
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ error: 'Error updating event' });
  }
});

// Delete an event
app.delete('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting event' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});