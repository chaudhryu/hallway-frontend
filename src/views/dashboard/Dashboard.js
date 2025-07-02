import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import metroLogo from 'src/assets/images/metroITSLogo.png'
import focusedForward from 'src/assets/images/focusedForward.png'

const BookingsList = ({ bookings, showRoomName = false, fontSize }) => {
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
    <ul className="bookings-list" style={{ fontSize: `${fontSize}px` }}>
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
    { id: 180, name: 'Huddle A (05-44)' },
    { id: 163, name: ' Huddle B (05-67)' },
    { id: 1609, name: 'Huddle C (05-98)' },
    { id: 2189, name: 'Huddle Room D' },
  ]

  const [aggregatedBookings, setAggregatedBookings] = useState([])
  const [fontSize, setFontSize] = useState(20) // Starting font size
  const containerRef = useRef(null)

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

      const now = new Date()
      const endOfDay = new Date()
      endOfDay.setHours(23, 59, 59, 999)

      const startDateTime = formatDateTime(now)
      const endDateTime = formatDateTime(endOfDay)

      const allBookings = {}

      for (const room of rooms) {
        const response = await fetch(
          `https://hallway-backend.onrender.com/api/bookings?startDateTime=${encodeURIComponent(
            startDateTime
          )}&endDateTime=${encodeURIComponent(
            endDateTime
          )}&roomId=${encodeURIComponent(room.id)}`
        )

        if (!response.ok) {
          console.error(`Network response was not ok for room ${room.id}`)
          continue
        }

        const data = await response.json()
        const roomBookings = data.bookings || data

        if (roomBookings && roomBookings.length > 0) {
          roomBookings.forEach((b) => (b.roomName = room.name))
          allBookings[room.id] = roomBookings
        }
      }

      // Flatten and sort
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
    const refreshInterval = setInterval(() => window.location.reload(), 600000) // 10 minutes

    return () => {
      clearInterval(fetchInterval)
      clearInterval(refreshInterval)
    }
  }, [])

  // Measure and reduce font size if overflowing
  useLayoutEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current

    // Reset to starting font size each time bookings change
    // so we can shrink from the original size again, if needed.
    let currentFontSize = 20
    setFontSize(currentFontSize)

    // We'll check overflow in a small timeout so the DOM updates with new font size
    const adjustFont = () => {
      // Keep trying to shrink until it fits or we hit min size
      const MIN_SIZE = 10
      while (isOverflowing(container) && currentFontSize > MIN_SIZE) {
        currentFontSize--
        setFontSize(currentFontSize)
        // Force a reflow by reading offsetHeight (hacky but simple)
        container.offsetHeight // eslint-disable-line no-unused-expressions
      }
    }

    // We can do a short timeout or force sync. 
    // Let's do a short setTimeout so the initial render happens, then we measure.
    const timer = setTimeout(adjustFont, 0)
    return () => clearTimeout(timer)
  }, [aggregatedBookings])

  /**
   * Checks if the container's scrollWidth/scrollHeight 
   * exceed its clientWidth/clientHeight.
   */
  function isOverflowing(el) {
    return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth
  }

  return (
    <>
      <style>{`
        /* 
          Remove scrolling from the entire page. 
          Anything that doesn't fit is cut off. 
        */
        html, body {
          margin: 0;
          padding: 0;
          height: 100%;
          overflow: hidden;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #333;
        }
        #root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: white;
        }

        /* Container for the list above the footer */
        .bookings-list-container {
          flex: 1;
          height: calc(100vh - 90px);
          box-sizing: border-box;
          padding: 20px 0;
          background-color: white;
          overflow: hidden; /* no scrolling - cut off if too big */
        }

        /* 
          Use flexbox, wrap from left to right.
          We'll shrink font if content doesn't fit.
        */
        .bookings-list {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;

          margin: 0;
          padding: 20px;
          width: 100%;
          height: 100%;
          overflow: hidden;

          border: 1px solid #cce0ff;
          border-radius: 8px;
          background: #fff;
          box-sizing: border-box;
        }

        .bookings-list li {
          list-style: none;
          width: 25%;
          box-sizing: border-box;
          border-bottom: 1px solid #e6f0ff;
          padding-bottom: 0.5rem;
        }

        .bookings-list li strong {
          display: block;
          color: #003366;
          margin-bottom: 0.3rem;
        }
        .bookings-list li em {
          color: #666;
        }

        .no-meetings-message {
          font-size: 1.5rem;
          text-align: center;
          color: #666;
          width: 100%;
          padding: 50px 0;
          border: 1px solid #cce0ff;
          border-radius: 8px;
          background-color: white;
          box-sizing: border-box;
        }

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

      <div className="bookings-list-container" ref={containerRef}>
        {aggregatedBookings.length > 0 ? (
          <BookingsList
            bookings={aggregatedBookings}
            showRoomName={true}
            fontSize={fontSize}
          />
        ) : (
          <p className="no-meetings-message">No meetings scheduled for today.</p>
        )}
      </div>

    {/*  <div className="footer-logos">
        <img src={metroLogo} alt="Metro Logo" className="footer-logo" />
        <img src={focusedForward} alt="Focused Forward Logo" className="footer-logo" />
      </div>*/}
    </>
  )
}

export default Dashboard
