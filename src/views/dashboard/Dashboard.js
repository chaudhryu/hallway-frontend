import React, { useState, useEffect, useRef } from 'react';
// Only import components needed for the list and logos
// import { CCard, CCardBody, CCardImage, CCardTitle, CCardText, CHeader } from '@coreui/react';

// Import only the needed logo images
import metroLogo from 'src/assets/images/metroITSLogo.png';
import focusedForward from 'src/assets/images/focusedForward.png';

// Commented out unused image imports
// import bryan from 'src/assets/images/bryan2.jpg';
// import pat from 'src/assets/images/pat.jpg';
// import medic from 'src/assets/images/medic.jpg';
// import medic2 from 'src/assets/images/medik2.png';
// import tee from 'src/assets/images/tee.jpg';
// import map from 'src/assets/images/crazyNewMap2.png';


const BookingsList = ({ bookings, showRoomName = false }) => {
  const listRef = useRef(null);
  const intervalRef = useRef(null); // Keep track of the interval
  const scrollDirectionRef = useRef(1); // *** Use useRef for scroll direction ***

  useEffect(() => {
    const list = listRef.current;
    // Clear any existing interval when bookings change or component unmounts
    if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }

    if (list) {
      // Function to start scrolling animation
      const startScrolling = () => {
          const maxScrollTop = list.scrollHeight - list.clientHeight;
           // Only scroll if there's significant content overflow
          if (maxScrollTop > 5) { // Use a slightly larger threshold

              // --- Set initial direction using the ref ---
              scrollDirectionRef.current = (list.scrollTop >= maxScrollTop - 2) ? -1 : 1;
              // --- End Initial Direction ---

              const scrollStep = 2; // Adjusted scroll step from previous code
              const scrollInterval = 30;

              intervalRef.current = setInterval(() => {
                 // Use local variable for readability inside interval, update ref at the end if needed (though direct update is fine here)
                 // let currentScrollDirection = scrollDirectionRef.current;
                 const currentMaxScroll = list.scrollHeight - list.clientHeight; // Recalculate in case of resize/dynamic content change

                 if(currentMaxScroll <= 5) { // Stop if content fits
                      clearInterval(intervalRef.current);
                      intervalRef.current = null;
                      list.scrollTop = 0; // Reset to top
                      return;
                 }

                 // --- Read and Write scrollDirectionRef.current ---
                 if (scrollDirectionRef.current === 1 && list.scrollTop >= currentMaxScroll - 1) { // Reached bottom (within 1px)
                     // console.log("Reached Bottom - Reversing UP"); // Optional log
                     scrollDirectionRef.current = -1; // Update ref to UP
                 }
                 else if (scrollDirectionRef.current === -1 && list.scrollTop <= 1) { // Reached top (within 1px)
                     // console.log("Reached Top - Reversing DOWN"); // Optional log
                     scrollDirectionRef.current = 1; // Update ref to DOWN
                 }
                 // --- END Read and Write ---


                 let nextScrollPosition = list.scrollTop + scrollStep * scrollDirectionRef.current; // Calculate using ref's current value
                 // Ensure position stays within bounds [0, currentMaxScroll]
                 nextScrollPosition = Math.max(0, Math.min(nextScrollPosition, currentMaxScroll));

                 // Check if the new position is different before setting to avoid unnecessary updates
                 if (list.scrollTop !== nextScrollPosition) {
                      list.scrollTop = nextScrollPosition;
                 }


              }, scrollInterval);
          } else {
               // Ensure it's scrolled to top if content fits or barely overflows
               list.scrollTop = 0;
          }
      }

      // Start scrolling slightly after component renders/updates to ensure layout is stable
      const timeoutId = setTimeout(startScrolling, 150); // Slightly increased delay

      return () => {
         clearTimeout(timeoutId); // Clear timeout on cleanup
         if (intervalRef.current) {
           clearInterval(intervalRef.current); // Clear interval on cleanup
           intervalRef.current = null;
         }
      };
    }
  }, [bookings]); // Rerun effect ONLY when bookings data changes

  // Function to format the time
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date).replace(' ', '').toLowerCase();
  };

  return (
    <ul className="bookings-list" ref={listRef}>
      {bookings.map((booking) => {
        const startTime = new Date(booking.timeFrom);
        const endTime = new Date(booking.timeTo);
        return (
          <li key={booking.bookingID}>
            <strong>
              {booking.meetingTitle} - {booking.creatorName}
            </strong>
            <br />
            {formatTime(startTime)} - {formatTime(endTime)}
            {showRoomName && (
              <>
                <br />
                <em>{booking.roomName}</em>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
};


const Dashboard = () => {
  // Array of room IDs and their names (still needed for fetching)
  const rooms = [
    { id: 94, name: 'East Wing (05-76)' },
    { id: 2194, name: 'Innovation Lab (05-92)' },
    { id: 139, name: 'Valencia (05-43)' },
    { id: 140, name: 'West Wing (05-20)' },
  ];

  // State remains the same
  const [bookings, setBookings] = useState({});
  const [aggregatedBookings, setAggregatedBookings] = useState([]);

  // fetchBookings function remains the same
  const fetchBookings = async () => {
    try {
      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const hours = ('0' + date.getHours()).slice(-2);
        const minutes = ('0' + date.getMinutes()).slice(-2);
        const seconds = ('0' + date.getSeconds()).slice(-2);
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };
      const startDateTime = formatDateTime(new Date());
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const endDateTime = formatDateTime(endOfDay);
      const allBookings = {};
      for (const room of rooms) {
        const roomId = room.id;
        // Updated fetch URL from previous version
        const response = await fetch(
          `https://hallway-backend.onrender.com/api/bookings?startDateTime=${encodeURIComponent(
            startDateTime
          )}&endDateTime=${encodeURIComponent(
            endDateTime
          )}&roomId=${encodeURIComponent(roomId)}`
        );
        // console.log(response) // Keep console log if needed for debugging
        if (!response.ok) {
          console.error(`Network response was not ok for room ${roomId}`);
          continue;
        }
        const data = await response.json();
        const roomBookings = data.bookings || data;
        if (roomBookings && roomBookings.length > 0) {
          roomBookings.forEach((booking) => {
            booking.roomName = room.name;
          });
          allBookings[roomId] = roomBookings;
        }
      }
      setBookings(allBookings);
      const aggregated = Object.values(allBookings).flat();
      aggregated.sort((a, b) => new Date(a.timeFrom) - new Date(b.timeFrom));
      setAggregatedBookings(aggregated);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // useEffect for fetching and refreshing remains the same
  useEffect(() => {
    fetchBookings();
    const fetchInterval = setInterval(fetchBookings, 3600000); // 1 hour (3,600,000 ms)
    const refreshInterval = setInterval(() => window.location.reload(), 600000); // 10 minutes (600,000 ms)
    return () => {
      clearInterval(fetchInterval);
      clearInterval(refreshInterval);
    };
  }, []);


  return (
    <>
      {/* ======================= STYLE CHANGES ======================= */}
      <style>{`
         /* Ensure body takes full viewport height and uses flex */
         body, html {
           height: 100%;
           margin: 0;
           padding: 0;
           overflow: hidden; /* Prevent viewport scrollbars */
           /* --- NEW FONT FAMILY --- */
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
           /* --- NEW BASE TEXT COLOR --- */
           color: #333333; /* Dark Grey */
         }
         #root {
           height: 100vh; /* Use viewport height */
           margin: 0;
           padding: 0;
           background-color: white;
           display: flex;
           flex-direction: column; /* Stack list container and footer */
           align-items: center; /* Center items horizontally */
         }
         /* Container for the bookings list */
         .bookings-list-container {
             width: 90%;
             max-width: 800px;
             height: calc(100vh - 90px);
             display: flex;
             flex-direction: column;
             justify-content: center;
             overflow: hidden;
             box-sizing: border-box;
             padding: 20px 0;
             background-color: white; /* Ensure container is white */
         }

         /* Styling for the list itself */
         .bookings-list {
            list-style-type: none;
            padding: 20px;
            margin: 0;
            font-size: 1.7rem;
            width: 100%;
            height: 100%;
            overflow-y: hidden;
            text-align: center;
            /* --- NEW BORDER COLOR --- */
            border: 1px solid #cce0ff; /* Light Blue-Grey Border */
            box-sizing: border-box;
            border-radius: 8px;
            background-color: white; /* Keep background white */
            line-height: 1.5;
            scroll-behavior: smooth;
            /* --- NEW DEFAULT TEXT COLOR FOR LIST ITEMS (times etc.) --- */
            color: #333333; /* Dark Grey */
         }
         .bookings-list li {
             margin-bottom: 25px;
             padding-bottom: 15px;
             /* --- NEW SEPARATOR COLOR --- */
             border-bottom: 1px solid #e6f0ff; /* Very Light Blue-Grey Separator */
         }
         .bookings-list li strong {
             display: block;
             margin-bottom: 5px;
             font-size: 1.8rem;
             /* --- NEW TITLE COLOR --- */
             color: #003366; /* Dark Blue */
         }
         .bookings-list li em {
             font-size: 1.5rem;
             /* --- NEW ROOM NAME COLOR --- */
             color: #666666; /* Medium Grey */
         }
         .bookings-list li:last-child {
             border-bottom: none;
             margin-bottom: 0;
             padding-bottom: 0;
         }

         /* Message when no meetings */
         .no-meetings-message {
             font-size: 2rem;
             text-align: center;
             /* --- NEW MESSAGE COLOR --- */
             color: #666666; /* Medium Grey */
             width: 100%;
             padding: 50px 0;
             height: 100%;
             display: flex;
             align-items: center;
             justify-content: center;
             /* --- NEW BORDER COLOR --- */
             border: 1px solid #cce0ff; /* Match list border */
             border-radius: 8px;
             background-color: white; /* Keep background white */
             box-sizing: border-box;
         }

         /* Footer Logo Styles - Fixed at bottom */
         .footer-logos {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 90px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0 25px;
            box-sizing: border-box;
            background-color: white;
            /* --- NEW BORDER COLOR --- */
            border-top: 1px solid #cce0ff; /* Match list border */
            z-index: 10;
         }
         .footer-logo {
             height: 60px;
             width: auto;
         }
       `}</style>
       {/* ===================== END STYLE CHANGES ===================== */}

       {/* Container for the list */}
       <div className="bookings-list-container">
          {aggregatedBookings.length > 0 ? (
              <BookingsList
                  bookings={aggregatedBookings} // Pass aggregatedBookings here
                  showRoomName={true}
              />
          ) : (
              // Display the no meetings message
              <p className="no-meetings-message">
                  No meetings scheduled for today.
              </p>
          )}
       </div>

       {/* Footer with logos */}
       <div className="footer-logos">
          <img src={metroLogo} alt="Metro Logo" className="footer-logo"/>
          <img src={focusedForward} alt="Focused Forward Logo" className="footer-logo"/>
       </div>

      {/* Other elements remain commented out */}
      {/* ... */}
    </>
  );
};


export default Dashboard;