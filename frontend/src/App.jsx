import { useState } from 'react'
import axios from 'axios'
import { CSVLink } from 'react-csv'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

const API_URL = 'http://localhost:8000/api/generate/'

function App() {
  const [rows, setRows] = useState([
    {
      id: 1,
      Business_Name: 'Acme Fitness',
      Business_Description: 'A local gym offering personal training and group fitness classes',
      'Address/Region': 'New York, USA',
      Generated_Cold_Email: '',
      Generated_Cold_Message: '',
    },
    {
      id: 2,
      Business_Name: 'Green Garden Cafe',
      Business_Description: 'Organic cafe serving healthy meals and smoothies',
      'Address/Region': 'San Francisco, CA',
      Generated_Cold_Email: '',
      Generated_Cold_Message: '',
    },
    {
      id: 3,
      Business_Name: 'Tech Solutions Inc',
      Business_Description: 'IT consulting and software development company',
      'Address/Region': 'Austin, TX',
      Generated_Cold_Email: '',
      Generated_Cold_Message: '',
    },
  ])

  const [loading, setLoading] = useState(false)

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
    setRows([
      {
        id: 1,
        Business_Name: '',
        Business_Description: '',
        'Address/Region': '',
        Generated_Cold_Email: '',
        Generated_Cold_Message: '',
      },
    ])
    toast.info('Table cleared')
  }

  const generateContent = async (type) => {
    const emptyRows = rows.filter(row => 
      !row.Business_Name.trim() || 
      !row.Business_Description.trim() || 
      !row['Address/Region'].trim()
    )

    if (emptyRows.length > 0) {
      toast.warning('Please fill in all business details before generating')
      return
    }

    setLoading(true)
    try {
      const businesses = rows.map(({ id, ...rest }) => rest)
      
      const response = await axios.post(API_URL, {
        type: type,
        businesses: businesses,
      })

      const results = response.data.results
      const updatedRows = rows.map((row, index) => ({
        ...row,
        ...results[index],
      }))

      setRows(updatedRows)
      toast.success(`${type === 'email' ? 'Emails' : 'Messages'} generated successfully!`)
    } catch (error) {
      console.error('Error generating content:', error)
      toast.error(error.response?.data?.error || 'Failed to generate content. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const csvHeaders = [
    { label: 'Business Name', key: 'Business_Name' },
    { label: 'Business Description', key: 'Business_Description' },
    { label: 'Address/Region', key: 'Address/Region' },
    { label: 'Generated Cold Email', key: 'Generated_Cold_Email' },
    { label: 'Generated Cold Message', key: 'Generated_Cold_Message' },
  ]

  const csvData = rows.map(({ id, ...rest }) => rest)

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <header className="app-header">
        <h1>AI Cold Mail & Message Generator</h1>
        <p>Generate personalized cold emails and messages for your potential clients</p>
      </header>

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
        <CSVLink
          data={csvData}
          headers={csvHeaders}
          filename="cold_outreach_results.csv"
          className="btn btn-info"
        >
          Export to CSV
        </CSVLink>
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
                  <textarea
                    value={row.Generated_Cold_Email}
                    onChange={(e) => handleInputChange(row.id, 'Generated_Cold_Email', e.target.value)}
                    disabled={loading}
                    placeholder="Email will appear here"
                    rows="4"
                  />
                </td>
                <td>
                  <textarea
                    value={row.Generated_Cold_Message}
                    onChange={(e) => handleInputChange(row.id, 'Generated_Cold_Message', e.target.value)}
                    disabled={loading}
                    placeholder="Message will appear here"
                    rows="4"
                  />
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
    </div>
  )
}

export default App
