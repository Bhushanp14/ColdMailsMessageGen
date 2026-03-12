import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useAuth } from './AuthContext'
import LoginModal from './LoginModal'
import './App.css'

const API_URL = window.location.hostname.includes('replit.dev')
  ? `https://${window.location.hostname}:8000/api/generate/`
  : 'http://localhost:8000/api/generate/'

const EXPORT_API_URL = window.location.hostname.includes('replit.dev')
  ? `https://${window.location.hostname}:8000/api/export_csv/`
  : 'http://localhost:8000/api/export_csv/'

const createEmptyRow = (id) => ({
  id,
  Business_Name: '',
  Business_Description: '',
  'Address/Region': '',
  Generated_Cold_Email: '',
  Generated_Cold_Message: '',
})

function App() {
  const { user, token, usage, logout, updateUsage, getRowLimit } = useAuth()
  const defaultCount = getRowLimit()
  const [rows, setRows] = useState(Array.from({ length: defaultCount }, (_, i) => createEmptyRow(i + 1)))
  const [loading, setLoading] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const pasteAreaRef = useRef(null)

  // Re-init rows when user logs in/out (limit changes)
  useEffect(() => {
    const newCount = getRowLimit()
    setRows(prev => {
      if (prev.length < newCount) {
        // Expand: add empty rows to fill
        const extra = Array.from(
          { length: newCount - prev.length },
          (_, i) => createEmptyRow(prev.length + i + 1)
        )
        return [...prev, ...extra]
      }
      return prev
    })
  }, [user, usage.emailLimit, usage.messageLimit])

  // 1. New state to track what's currently in the modal
  const [modalContent, setModalContent] = useState(null); // { title: string, body: string } 

  // 🆕 New states for dropdowns
  const [senderRole, setSenderRole] = useState('Web Developer')
  const [outreachTone, setOutreachTone] = useState('Friendly')
  const [demoSite, setDemoSite] = useState('No')

  // Function to open the modal
  const openModal = (title, content) => {
    setModalContent({ title, content });
  };

  // Function to close the modal
  const closeModal = () => {
    setModalContent(null);
  };

  const handleInputChange = (id, field, value) => {
    setRows(rows.map(row =>
      row.id === id ? { ...row, [field]: value } : row
    ))
  }

  const addRow = () => {
    if (rows.length >= 100) {
      toast.warning('Maximum 100 rows allowed per session.')
      return
    }
    const newId = Math.max(...rows.map(r => r.id), 0) + 1
    const limit = getRowLimit()
    if (rows.length >= limit) {
      toast.info(user ? 'You\'ve reached your credit limit.' : 'Sign up to unlock more rows!', { autoClose: 4000 })
    }
    setRows([...rows, createEmptyRow(newId)])
  }

  const deleteRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id))
    } else {
      toast.error('Cannot delete the last row')
    }
  }

  const clearTable = () => {
    const count = getRowLimit()
    setRows(Array.from({ length: count }, (_, i) => createEmptyRow(i + 1)))
    toast.info(`Table cleared - ${count} empty rows ready`)
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text')

    const lines = pastedData.split('\n').filter(line => line.trim())
    const parsedRows = []

    lines.forEach((line, index) => {
      const columns = line.split('\t')
      if (columns.length >= 3) {
        parsedRows.push({
          id: index + 1,
          Business_Name: columns[0]?.trim() || '',
          Business_Description: columns[1]?.trim() || '',
          'Address/Region': columns[2]?.trim() || '',
          Generated_Cold_Email: '',
          Generated_Cold_Message: '',
        })
      }
    })

    if (parsedRows.length > 0) {
      // Cap at 100 rows total
      const cappedRows = parsedRows.slice(0, 100)
      const limit = getRowLimit()
      const remainingRows = limit - cappedRows.length
      const emptyRows = remainingRows > 0
        ? Array.from({ length: remainingRows }, (_, i) => createEmptyRow(cappedRows.length + i + 1))
        : []

      setRows([...cappedRows, ...emptyRows])

      if (cappedRows.length > limit) {
        const unlockable = cappedRows.length - limit
        toast.info(
          `Pasted ${cappedRows.length} items. ${limit} are ready to generate; ${user ? 'upgrade' : 'sign up'} to unlock the other ${unlockable}!`,
          { autoClose: 6000 }
        )
      } else {
        toast.success(`${cappedRows.length} rows pasted successfully!`)
      }
    } else {
      toast.error('Invalid paste data. Please copy 3 columns from Excel (Business Name, Description, Address)')
    }
  }

  const generateContent = async (type) => {
    const filledRows = rows.filter(row =>
      row.Business_Name.trim() &&
      row.Business_Description.trim() &&
      row['Address/Region'].trim()
    )

    if (filledRows.length === 0) {
      toast.warning('Please fill in at least one row with business details before generating')
      return
    }

    // Check remaining credits on the client side for a better UX message
    const remaining = type === 'email'
      ? usage.emailLimit - usage.emailCount
      : usage.messageLimit - usage.messageCount

    if (remaining <= 0) {
      toast.error(`${type === 'email' ? 'Email' : 'Message'} credits exhausted!`)
      if (!user) setIsLoginModalOpen(true)
      return
    }

    setLoading(true)
    try {
      // Send all filled rows — backend will slice to remaining credits
      const businesses = filledRows.map(({ id, ...rest }) => rest)

      const config = {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }

      const response = await axios.post(API_URL, {
        type: type,
        outreach_tone: outreachTone,
        sender_role: senderRole,
        demo_site: demoSite,
        businesses: businesses,
      }, config)

      const { results, email_count, message_count, processed, total_requested } = response.data
      updateUsage(email_count, message_count)

      const updatedRows = rows.map((row) => {
        const filledIndex = filledRows.findIndex(fr =>
          fr.Business_Name === row.Business_Name &&
          fr.Business_Description === row.Business_Description &&
          fr['Address/Region'] === row['Address/Region']
        )
        if (filledIndex !== -1 && results[filledIndex]) {
          return { ...row, ...results[filledIndex] }
        }
        return row
      })

      setRows(updatedRows)

      if (processed < total_requested) {
        const remaining = total_requested - processed
        toast.info(
          `Generated for ${processed} businesses. ${remaining} more require ${user ? 'an upgrade' : 'signup'}.`,
          { autoClose: 5000 }
        )
        if (!user) setIsLoginModalOpen(true)
      } else {
        toast.success(`${type === 'email' ? 'Emails' : 'Messages'} generated for ${processed} businesses!`)
      }
    } catch (error) {
      console.error('Error generating content:', error)
      if (error.response?.data?.limit_reached) {
        toast.error(`${type === 'email' ? 'Email' : 'Message'} limit reached!`)
        if (!user) setIsLoginModalOpen(true)
      } else {
        toast.error(error.response?.data?.error || 'Failed to generate content. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // 🆕 Backend CSV export function
  const handleExportCSV = async () => {
    try {
      const validRows = rows.filter(r =>
        r.Business_Name?.trim() ||
        r.Business_Description?.trim() ||
        r['Address/Region']?.trim()
      )

      if (validRows.length === 0) {
        toast.warning('No valid data to export!')
        return
      }

      const response = await axios.post(EXPORT_API_URL,
        { rows: validRows },
        { responseType: 'blob' }
      )

      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'cold_outreach_results.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast.success('CSV exported successfully!')
    } catch (error) {
      console.error('CSV export failed:', error)
      toast.error('Failed to export CSV.')
    }
  }

  return (
    <div className="app-container max-w-7xl mx-auto">
      <ToastContainer position="top-right" autoClose={3000} />

      <header className="app-header">
        <div className="auth-bar">
          <div className="usage-stats">
            <span className={`usage-pill ${usage.emailCount >= usage.emailLimit ? 'usage-limit' : ''}`}>
              ✉️ Emails: <strong>{usage.emailCount}/{usage.emailLimit}</strong>
            </span>
            <span className={`usage-pill ${usage.messageCount >= usage.messageLimit ? 'usage-limit' : ''}`}>
              💬 Messages: <strong>{usage.messageCount}/{usage.messageLimit}</strong>
            </span>
            {!user && (usage.emailCount >= usage.emailLimit || usage.messageCount >= usage.messageLimit) && (
              <span className="sign-up-prompt">Sign up for 15 more free!</span>
            )}
          </div>
          <div className="user-actions">
            {user ? (
              <>
                <span className="user-email">{user.email}</span>
                <button onClick={logout} className="btn-link">Logout</button>
              </>
            ) : (
              <button onClick={() => setIsLoginModalOpen(true)} className="btn btn-primary btn-sm">
                Login / Signup
              </button>
            )}
          </div>
        </div>
        <h1>AI Cold Mail & Message Generator</h1>
        <p>Generate personalized cold emails and messages for your potential clients</p>
      </header>

      <div className="paste-area-container">
        <div className="paste-instructions">
          <strong>📋 Bulk Paste from Excel:</strong> Copy 3 columns from Excel (Business Name, Description, Address/Region) and paste below
        </div>
        <textarea
          ref={pasteAreaRef}
          className="paste-area"
          placeholder="Paste your Excel data here (3 columns: Business Name | Description | Address/Region)&#10;Example:&#10;Acme Fitness       A local gym     New York, USA&#10;Green Cafe    Organic cafe    San Francisco, CA"
          onPaste={handlePaste}
          disabled={loading}
        />
      </div>

      <div className="sender-options">
        <div className="option-group">
          <p className="helper-text">Select the service you are offering to the business.</p>
          <div className="input-row">
            <label><strong>Your Role / Designation:</strong></label>
            <select
              value={senderRole}
              onChange={(e) => setSenderRole(e.target.value)}
              disabled={loading}
              className="dropdown"
            >
              <option value="Web Developer">Web Developer</option>
              <option value="Web Designer">Web Designer</option>
              <option value="SEO Specialist">SEO Specialist</option>
              <option value="Digital Marketer">Digital Marketer</option>
              <option value="Social Media Manager">Social Media Manager</option>
              <option value="Graphic Designer">Graphic Designer</option>
              <option value="Video Editor">Video Editor</option>
              <option value="AI / Automation Consultant">AI / Automation Consultant</option>
            </select>
          </div>
        </div>

        <div className="option-group">
          <div className="input-row">
            <label><strong>Tone:</strong></label>
            <select
              value={outreachTone}
              onChange={(e) => setOutreachTone(e.target.value)}
              disabled={loading}
              className="dropdown"
            >
              <option value="Friendly">Friendly</option>
              <option value="Short & Direct">Short & Direct</option>
              <option value="Professional">Professional</option>
              <option value="Casual">Casual</option>
            </select>
          </div>
        </div>

        <div className="option-group">
          <div className="input-row">
            <label><strong>Example / Demo Ready</strong></label>
            <select
              value={demoSite}
              onChange={(e) => setDemoSite(e.target.value)}
              disabled={loading}
              className="dropdown"
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>
      </div>
      <div className="action-buttons">
        <button onClick={addRow} className="btn btn-primary">
          Add Row
        </button>
        <button onClick={clearTable} className="btn btn-secondary">
          Clear Table
        </button>
        <button
          onClick={() => generateContent('email')}
          disabled={loading}
          className="btn btn-success"
        >
          {loading ? 'Generating...' : 'Generate Cold Emails'}
        </button>
        <button
          onClick={() => generateContent('message')}
          disabled={loading}
          className="btn btn-success"
        >
          {loading ? 'Generating...' : 'Generate Cold Messages'}
        </button>
        <button onClick={handleExportCSV} className="btn btn-info">
          Export to CSV
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Business Description</th>
              <th>Address/Region</th>
              <th>Generated Cold Email</th>
              <th>Generated Cold Message</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isLocked = index >= getRowLimit();
              return (
                <tr key={row.id} className={isLocked ? 'row-locked' : ''}>
                  <td>
                    <input
                      type="text"
                      value={row.Business_Name}
                      onChange={(e) => handleInputChange(row.id, 'Business_Name', e.target.value)}
                      disabled={loading || isLocked}
                      placeholder="Enter business name"
                    />
                    {isLocked && <div className="locked-indicator">🔒 Sign up to unlock</div>}
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.Business_Description}
                      onChange={(e) => handleInputChange(row.id, 'Business_Description', e.target.value)}
                      disabled={loading}
                      placeholder="Enter description"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row['Address/Region']}
                      onChange={(e) => handleInputChange(row.id, 'Address/Region', e.target.value)}
                      disabled={loading}
                      placeholder="Enter address/region"
                    />
                  </td>

                  <td>
                    {row.Generated_Cold_Email ? (
                      <button
                        onClick={() => openModal('Generated Cold Email', row.Generated_Cold_Email)}
                        className="btn btn-info btn-sm"
                        disabled={loading}
                      >
                        View Email
                      </button>
                    ) : (
                      <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                        Email will appear here...
                      </div>
                    )}
                  </td>

                  <td>
                    {row.Generated_Cold_Message ? (
                      // Button will open the modal with message content
                      <button
                        onClick={() => openModal('Generated Cold Message', row.Generated_Cold_Message)}
                        className="btn btn-info btn-sm"
                        disabled={loading}
                      >
                        View Message
                      </button>
                    ) : (
                      // Display placeholder if no content is generated yet
                      <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                        Message will appear here...
                      </div>
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => deleteRow(row.id)}
                      disabled={loading}
                      className="btn btn-danger btn-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* 3. Modal Rendering Logic */}
      {
        modalContent && (
          <div className="modal-overlay" onClick={closeModal}>
            <div
              className="modal-content"
              // Prevent closing when clicking inside the content box
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-btn" onClick={closeModal}>&times;</button>
              <h3>{modalContent.title}</h3>
              {/* Using <pre> to maintain line breaks and whitespace */}
              <pre>{modalContent.content}</pre>
            </div>
          </div>
        )
      }
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div >
  )
}

export default App
