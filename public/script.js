$(document).ready(function () {
  let filteredEvents = [];
  let unlockedEvents = new Set();

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  $('#date').attr('min', today);

  // Show/hide access code field based on visibility
  $('input[name="visibility"]').change(function () {
    if ($(this).val() === 'private') {
      $('#accessCodeField').show();
      $('#accessCode').prop('required', true);
    } else {
      $('#accessCodeField').hide();
      $('#accessCode').prop('required', false);
    }
  });

  // Open popup form for adding
  $('#openFormBtn').click(function () {
    $('#formTitle').text('Add New Event');
    $('#submitFormBtn').text('Save Event');
    $('#eventForm')[0].reset();
    $('#eventId').val('');
    $('input[name="visibility"][value="public"]').prop('checked', true);
    $('#accessCodeField').hide();
    $('#accessCode').prop('required', false);
    $('#eventFormPopup').fadeIn();
  });

  // Close popup form
  $('#closeFormBtn, #cancelFormBtn').click(function () {
    $('#eventFormPopup').fadeOut();
    $('#eventForm')[0].reset();
  });

  // Close popup when clicking outside
  $(window).click(function (event) {
    if (event.target.id === 'eventFormPopup') {
      $('#eventFormPopup').fadeOut();
      $('#eventForm')[0].reset();
    }
    if (event.target.id === 'accessCodePopup') {
      $('#accessCodePopup').fadeOut();
    }
  });

  // Close access code popup
  $('#closeAccessCodePopup').click(function () {
    $('#accessCodePopup').fadeOut();
  });

  // Handle form submission (add or edit)
  $('#eventForm').submit(function (event) {
    event.preventDefault();
    const eventId = $('#eventId').val();
    const imageFile = $('#image')[0].files[0];
    const method = eventId ? 'PUT' : 'POST';
    const url = eventId ? `/events/${eventId}` : '/events';

    // Convert image to base64 if present
    const convertImageToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        if (!file) return resolve('');
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    convertImageToBase64(imageFile).then(imageBase64 => {
      const eventData = {
        title: $('#title').val(),
        description: $('#description').val(),
        type: $('#type').val(),
        date: $('#date').val(),
        time: $('#time').val(),
        location: $('#location').val(),
        addressLink: $('#addressLink').val(),
        image: imageBase64,
        ticketPrice: $('#ticketPrice').val() || 0,
        peopleLimit: $('#peopleLimit').val() || '',
        visibility: $('input[name="visibility"]:checked').val(),
        accessCode: $('#accessCode').val(),
      };

      $.ajax({
        url: url,
        method: method,
        contentType: 'application/json',
        data: JSON.stringify(eventData),
        success: function () {
          $('#eventForm')[0].reset();
          $('#eventFormPopup').fadeOut();
          fetchEvents();
        },
        error: function (xhr) {
          alert(`Error ${eventId ? 'updating' : 'adding'} event: ${xhr.responseJSON?.error || 'Unknown error'}`);
        }
      });
    }).catch(err => {
      alert('Error processing image: ' + err.message);
    });
  });

  // Search button functionality
  $('#searchBtn').click(function () {
    const searchTerm = $('#searchInput').val().toLowerCase();
    const typeFilter = $('#typeFilter').val();
    fetchEvents(events => {
      filteredEvents = events.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter ? event.type === typeFilter : true;
        return matchesSearch && matchesType;
      });
      renderEvents(filteredEvents, searchTerm);
    });
  });

  // Type filter change
  $('#typeFilter').change(function () {
    $('#searchBtn').click();
  });

  // Function to fetch events from the backend
  function fetchEvents(callback) {
    $.ajax({
      url: '/events',
      method: 'GET',
      success: function (events) {
        if (callback) {
          callback(events);
        } else {
          filteredEvents = events;
          renderEvents(filteredEvents);
        }
      },
      error: function () {
        $('#eventList').html('<li class="error">Failed to load events</li>');
        if (callback) callback([]);
      }
    });
  }

  // Function to calculate time until event
  function getTimeUntilEvent(eventDate, eventTime) {
    const now = new Date();
    const eventDateTime = new Date(`${eventDate}T${eventTime}`);
    const diffMs = eventDateTime - now;
    if (diffMs < 0) return 'Event has passed';
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (diffDays > 0) return `${diffDays} days remaining`;
    return `${diffHours} hours remaining`;
  }

  // Function to render events
  function renderEvents(eventsToRender, searchTerm = '') {
    const $eventList = $('#eventList');
    const $eventListContainer = $('.event-list-container');
    $eventList.empty();
    if (eventsToRender.length === 0) {
      $eventListContainer.addClass('empty');
      if (searchTerm) {
        $eventList.html(`<li>No events found with name "${searchTerm}"<br>Add a new event to get started</li>`);
      } else {
        $eventList.html('<li>No events found<br>Add a new event to get started</li>');
      }
    } else {
      $eventListContainer.removeClass('empty');
      eventsToRender.forEach(function (event) {
        const li = $('<li>');
        let eventDetails = '';
        if (event.visibility === 'private' && !unlockedEvents.has(event._id)) {
          eventDetails = `
            <div>
              <span class="event-type">${event.type}</span> 
              ${event.title} (Private)
            </div>
          `;
          const viewDetailsBtn = $('<button>')
            .text('View Details')
            .addClass('view-details-btn')
            .click(function () {
              openAccessCodePopup(event);
            });
          li.append(eventDetails).append(viewDetailsBtn);
        } else {
          const timeUntil = getTimeUntilEvent(event.date, event.time);
          const ticketInfo = event.ticketPrice == 0 ? 'Free Entry' : `Ticket: $${event.ticketPrice}`;
          const peopleLimit = event.peopleLimit ? `Limit: ${event.peopleLimit} people` : '';
          const addressLink = event.addressLink ? `<a href="${event.addressLink}" target="_blank">View Location</a>` : '';
          const image = event.image ? `<img src="${event.image}" alt="${event.title}" />` : '';
          eventDetails = `
            <div>
              <span class="event-type">${event.type}</span> 
              ${event.title} - ${event.description} 
              on ${event.date} at ${event.time}, ${event.location}
              ${addressLink ? '<br>' + addressLink : ''}
              <br>${timeUntil}
              <br>${ticketInfo}${peopleLimit ? ' | ' + peopleLimit : ''}
              ${image}
            </div>
          `;
          li.append(eventDetails);
        }
        const actions = $('<div>').addClass('event-actions');
        const editBtn = $('<button>')
          .text('Edit')
          .addClass('edit-btn')
          .click(function () {
            editEvent(event);
          });
        const deleteBtn = $('<button>')
          .text('Delete')
          .addClass('delete-btn')
          .click(function () {
            deleteEvent(event._id);
          });
        actions.append(editBtn).append(deleteBtn);
        li.append(actions);
        $eventList.append(li);
      });
    }
    // Display raw event data
    fetchEvents(events => {
      $('#rawEventData').text(JSON.stringify(events, null, 2));
    });
  }

  // Function to edit an event
  function editEvent(event) {
    $('#formTitle').text('Edit Event');
    $('#submitFormBtn').text('Update Event');
    $('#eventId').val(event._id);
    $('#title').val(event.title);
    $('#description').val(event.description);
    $('#date').val(event.date);
    $('#time').val(event.time);
    $('#type').val(event.type);
    $('#location').val(event.location);
    $('#addressLink').val(event.addressLink);
    $('#ticketPrice').val(event.ticketPrice);
    $('#peopleLimit').val(event.peopleLimit);
    $(`input[name="visibility"][value="${event.visibility}"]`).prop('checked', true);
    if (event.visibility === 'private') {
      $('#accessCodeField').show();
      $('#accessCode').prop('required', true);
      $('#accessCode').val(event.accessCode);
    } else {
      $('#accessCodeField').hide();
      $('#accessCode').prop('required', false);
    }
    $('#eventFormPopup').fadeIn();
  }

  // Function to open access code popup (only for private events)
  function openAccessCodePopup(event) {
    if (event.visibility !== 'private') return;
    $('#accessCodeInput').val('');
    $('#submitAccessCodeBtn').off('click').click(function () {
      const enteredCode = $('#accessCodeInput').val();
      if (enteredCode === event.accessCode) {
        unlockedEvents.add(event._id);
        $('#accessCodePopup').fadeOut();
        renderEvents(filteredEvents);
      } else {
        alert('Incorrect access code');
      }
    });
    $('#accessCodePopup').fadeIn();
  }

  // Function to delete an event
  function deleteEvent(id) {
    if (confirm('Are you sure you want to delete this event?')) {
      $.ajax({
        url: `/events/${id}`,
        method: 'DELETE',
        success: function () {
          unlockedEvents.delete(id);
          fetchEvents();
        },
        error: function (xhr) {
          alert('Error deleting event: ' + (xhr.responseJSON?.error || 'Unknown error'));
        }
      });
    }
  }

  // Initial fetch and render
  fetchEvents();
});