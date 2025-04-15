import React, { useState, useEffect } from 'react'
// Only import components needed for the list and logos

// Import only the needed logo images
import metroLogo from 'src/assets/images/metroITSLogo.png'
import focusedForward from 'src/assets/images/focusedForward.png'

// A simplified BookingsList that does NOT auto-scroll
const BookingsList = ({ bookings, showRoomName = false }) => {
  // Function to format the time
  const formatTime = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(date)
      .replace(' ', '')
      .toLowerCase()
  }

  return (
    <ul className="bookings-list">
      {bookings.map((booking) => {
        const startTime = new Date(booking.timeFrom)
        const endTime = new Date(booking.timeTo)
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
        )
      })}
    </ul>
  )
}

const Dashboard = () => {
  const rooms = [
    { id: 94, name: 'East Wing (05-76)' },
    { id: 2194, name: 'Innovation Lab (05-92)' },
    { id: 139, name: 'Valencia (05-43)' },
    { id: 140, name: 'West Wing (05-20)' },
  ]

  const [bookings, setBookings] = useState({})
  const [aggregatedBookings, setAggregatedBookings] = useState([])

  const fetchBookings = async () => {
    try {
      const formatDateTime = (date) => {
        const year = date.getFullYear()
        const month = ('0' + (date.getMonth() + 1)).slice(-2)
        const day = ('0' + date.getDate()).slice(-2)
        const hours = ('0' + date.getHours()).slice(-2)
        const minutes = ('0' + date.getMinutes()).slice(-2)
        const seconds = ('0' + date.getSeconds()).slice(-2)
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
      }

      const startDateTime = formatDateTime(new Date())
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)
      const endDateTime = formatDateTime(endOfDay)

      const allBookings = {}
      for (const room of rooms) {
        const roomId = room.id
        const response = await fetch(
          `https://hallway-backend.onrender.com/api/bookings?startDateTime=${encodeURIComponent(
            startDateTime
          )}&endDateTime=${encodeURIComponent(
            endDateTime
          )}&roomId=${encodeURIComponent(roomId)}`
        )

        if (!response.ok) {
          console.error(`Network response was not ok for room ${roomId}`)
          continue
        }

        const data = await response.json()
        const roomBookings = data.bookings || data

        if (roomBookings && roomBookings.length > 0) {
          // Attach roomName
          roomBookings.forEach((booking) => {
            booking.roomName = room.name
          })
          allBookings[roomId] = roomBookings
        }
      }
      setBookings(allBookings)

      const aggregated = Object.values(allBookings).flat()
      aggregated.sort((a, b) => new Date(a.timeFrom) - new Date(b.timeFrom))
      setAggregatedBookings(aggregated)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    }
  }

  useEffect(() => {
    fetchBookings()
    const fetchInterval = setInterval(fetchBookings, 3600000) // 1 hour
    const refreshInterval = setInterval(
      () => window.location.reload(),
      600000 // 10 minutes
    )

    return () => {
      clearInterval(fetchInterval)
      clearInterval(refreshInterval)
    }
  }, [])

  return (
    <>
      {/* ======================= STYLE CHANGES ======================= */}
      <style>{`
         /* Ensure body takes full viewport height, no forced overflow hidden */
         body, html {
           height: 100%;
           margin: 0;
           padding: 0;
           /* Removed overflow: hidden to allow the entire list to be visible if it grows. */
           font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
           color: #333333;
         }
         #root {
           min-height: 100vh;
           margin: 0;
           padding: 0;
           background-color: white;
           display: flex;
           flex-direction: column; 
           align-items: center; 
         }

         /* Container for the bookings list */
         .bookings-list-container {
             width: 90%;
             max-width: 800px;
             /* Removed fixed height to allow list to grow */
             padding: 20px 0;
             box-sizing: border-box;
             background-color: white;
         }

         .bookings-list {
            list-style-type: none;
            padding: 20px;
            margin: 0;
            font-size: 1.7rem;
            width: 100%;
            /* Removed overflow hidden and fixed height */
            text-align: center;
            border: 1px solid #cce0ff; 
            box-sizing: border-box;
            border-radius: 8px;
            background-color: white;
            line-height: 1.5;
            color: #333333;
         }
         .bookings-list li {
             margin-bottom: 25px;
             padding-bottom: 15px;
             border-bottom: 1px solid #e6f0ff;
         }
         .bookings-list li strong {
             display: block;
             margin-bottom: 5px;
             font-size: 1.8rem;
             color: #003366;
         }
         .bookings-list li em {
             font-size: 1.5rem;
             color: #666666;
         }
         .bookings-list li:last-child {
             border-bottom: none;
             margin-bottom: 0;
             padding-bottom: 0;
         }

         .no-meetings-message {
             font-size: 2rem;
             text-align: center;
             color: #666666;
             width: 100%;
             padding: 50px 0;
             border: 1px solid #cce0ff;
             border-radius: 8px;
             background-color: white;
             box-sizing: border-box;
         }

         /* Footer Logo Styles */
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
            border-top: 1px solid #cce0ff;
            z-index: 10;
         }
         .footer-logo {
             height: 60px;
             width: auto;
         }
       `}</style>
      {/* ===================== END STYLE CHANGES ===================== */}

      <div className="bookings-list-container">
        {aggregatedBookings.length > 0 ? (
          <BookingsList bookings={aggregatedBookings} showRoomName={true} />
        ) : (
          <p className="no-meetings-message">
            No meetings scheduled for today.
          </p>
        )}
      </div>


    </>
  )
}

export default Dashboard
