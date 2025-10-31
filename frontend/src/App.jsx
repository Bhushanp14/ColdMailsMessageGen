import { useState, useRef } from 'react'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
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

const initialRows = Array.from({ length: 100 }, (_, i) => createEmptyRow(i + 1))

function App() {
  const [rows, setRows] = useState(initialRows)
  const [loading, setLoading] = useState(false)
  const pasteAreaRef = useRef(null)

  // 1. New state to track what's currently in the modal
  const [modalContent, setModalContent] = useState(null); // { title: string, body: string } 

  // 🆕 New states for dropdowns
  const [senderRole, setSenderRole] = useState('Web Developer')
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
    const newId = Math.max(...rows.map(r => r.id), 0) + 1
    setRows([
      ...rows,
      {
        id: newId,
        Business_Name: '',
        Business_Description: '',
        'Address/Region': '',
        Generated_Cold_Email: '',
        Generated_Cold_Message: '',
      },
    ])
  }

  const deleteRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id))
    } else {
      toast.error('Cannot delete the last row')
    }
  }

  const clearTable = () => {
    setRows(Array.from({ length: 100 }, (_, i) => createEmptyRow(i + 1)))
    toast.info('Table cleared - 100 empty rows ready')
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
      const remainingRows = 100 - parsedRows.length
      const emptyRows = remainingRows > 0 
        ? Array.from({ length: remainingRows }, (_, i) => createEmptyRow(parsedRows.length + i + 1))
        : []
      
      setRows([...parsedRows, ...emptyRows])
      toast.success(`${parsedRows.length} rows pasted successfully!`)
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

    setLoading(true)
    try {
      const businesses = filledRows.map(({ id, ...rest }) => rest)
      
      const response = await axios.post(API_URL, {
        type: type,
        sender_role: senderRole,
        demo_site: demoSite,
        businesses: businesses,
      })

      const results = response.data.results
      
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
      toast.success(`${type === 'email' ? 'Emails' : 'Messages'} generated for ${filledRows.length} businesses!`)
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error(error.response?.data?.error || 'Failed to generate content. Please try again.')
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
          <label><strong>Your Role / Designation:</strong></label>
          <select 
            value={senderRole} 
            onChange={(e) => setSenderRole(e.target.value)} 
            disabled={loading}
            className="dropdown"
          >
            <option value="Web Developer">Web Developer</option>
            <option value="Web Designer">Web Designer</option>
            <option value="Freelancer">Freelancer</option>
            <option value="Agency Owner">Agency Owner</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="option-group">
          <label><strong>Do you have a demo site ready?</strong></label>
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
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="text"
                      value={row.Business_Name}
                      onChange={(e) => handleInputChange(row.id, 'Business_Name', e.target.value)}
                      disabled={loading}
                      placeholder="Enter business name"
                    />
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
                        onClick={() => openModal('Generated Cold Email',row.Generated_Cold_Email)}
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
              ))}
            </tbody>
          </table>
        </div>
        {/* 3. Modal Rendering Logic */}
      {modalContent && (
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
      )}
    </div>
  )
}

export default App
