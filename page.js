'use client'

import { useState, useEffect } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField } from '@mui/material'
import { firestore } from '@/firebase'
import {
  collection,
  getDocs,
  query,
  getDoc,
  setDoc,
  doc,
  deleteDoc
} from 'firebase/firestore'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: '#1e1e1e', // Dark background for modal
  borderRadius: '16px',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

const buttonStyle = {
  borderRadius: '20px',
  textTransform: 'none',
  backgroundColor: '#00bcd4', // Neon teal color
  color: 'white',
}

const inventoryItemStyle = {
  borderRadius: '12px',
  padding: '16px',
  backgroundColor: '#2a2a2a', // Dark item box
  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
  alignItems: 'flex-start',
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: 'calc(100vh - 80px)',
  gap: '20px',
  overflow: 'auto',
}

const chartContainerStyle = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
}

const gradientBackground = {
  background: '#121212', // Futuristic dark background
}

const inventoryContainerStyle = {
  width: '50%',
  bgcolor: '#1f1f1f', // Dark contrasting color for inventory box
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
  p: 2,
  maxHeight: 'calc(100vh - 80px)',
  overflow: 'auto',
  color: 'white', // White font color for contrast
}

const chartStyle = {
  width: '100%',
  height: '100%',
  maxWidth: '600px',
  bgcolor: '#2a2a2a', // Dark grey for pie chart box
  borderRadius: '12px',
  boxShadow: '0 6px 12px rgba(0,0,0,0.3)',
  p: 2,
}

const searchBarContainerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  mb: 3,
}

const searchBarStyle = {
  flex: 1,
  borderRadius: '20px',
  bgcolor: 'white', // White background for search bar
  input: {
    color: 'black',
  },
}

const addButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#ff4081', // Neon pink color for "Add New Item" button
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [openAdd, setOpenAdd] = useState(false)
  const [openUpdate, setOpenUpdate] = useState(false)
  const [itemName, setItemName] = useState('')
  const [description, setDescription] = useState('')
  const [entryDate, setEntryDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [quantity, setQuantity] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItemId, setSelectedItemId] = useState(null)

  const updateInventory = async () => {
    const snapshot = query(collection(firestore, 'inventory'))
    const docs = await getDocs(snapshot)
    const inventoryList = []
    docs.forEach((doc) => {
      inventoryList.push({ id: doc.id, ...doc.data() })
    })
    setInventory(inventoryList)
    setFilteredInventory(inventoryList)
  }

  const removeItem = async (itemId) => {
    const docRef = doc(collection(firestore, 'inventory'), itemId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity } = docSnap.data()
      if (quantity === 1) {
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, { quantity: quantity - 1 }, { merge: true })
      }
    }
    await updateInventory()
  }

  const addItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), itemName)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const { quantity: existingQuantity } = docSnap.data()
      await setDoc(docRef, { quantity: existingQuantity + parseInt(quantity) }, { merge: true })
    } else {
      await setDoc(docRef, { quantity: parseInt(quantity), description, entryDate, expiryDate })
    }
    setItemName('')
    setDescription('')
    setEntryDate('')
    setExpiryDate('')
    setQuantity('')
    handleCloseAdd()
    await updateInventory()
  }

  const updateItem = async () => {
    const docRef = doc(collection(firestore, 'inventory'), selectedItemId)
    await setDoc(docRef, { quantity: parseInt(quantity), description, entryDate, expiryDate }, { merge: true })
    setItemName('')
    setDescription('')
    setEntryDate('')
    setExpiryDate('')
    setQuantity('')
    handleCloseUpdate()
    await updateInventory()
  }

  const handleSearch = (event) => {
    const query = event.target.value.toLowerCase()
    setSearchQuery(query)
    const filtered = inventory.filter(item =>
      item.id.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    )
    setFilteredInventory(filtered)
  }

  const handleOpenAdd = () => setOpenAdd(true)
  const handleCloseAdd = () => setOpenAdd(false)

  const handleOpenUpdate = (item) => {
    setItemName(item.id)
    setDescription(item.description)
    setEntryDate(item.entryDate)
    setExpiryDate(item.expiryDate)
    setQuantity(item.quantity)
    setSelectedItemId(item.id)
    setOpenUpdate(true)
  }

  const handleCloseUpdate = () => setOpenUpdate(false)

  useEffect(() => {
    updateInventory()
  }, [])

  const pieData = {
    labels: filteredInventory.map(item => item.id),
    datasets: [
      {
        label: 'Quantity',
        data: filteredInventory.map(item => item.quantity),
        backgroundColor: filteredInventory.map((_, index) => `hsl(${index * 45}, 70%, 50%)`),
        borderWidth: 1,
      },
    ],
  }

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'white',
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  }

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      alignItems={'center'}
      p={3}
      sx={gradientBackground}
    >
      {/* Add Item Modal */}
      <Modal
        open={openAdd}
        onClose={handleCloseAdd}
        aria-labelledby="modal-modal-title-add"
        aria-describedby="modal-modal-description-add"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title-add" variant="h6" component="h2" gutterBottom sx={{ color: 'white' }}>
            Add Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              id="item-name-add"
              label="Item Name"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="description-add"
              label="Description"
              variant="outlined"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="entry-date-add"
              label="Entry Date"
              type="date"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="expiry-date-add"
              label="Expiry Date"
              type="date"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="quantity-add"
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={addItem}
              sx={addButtonStyle}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Update Item Modal */}
      <Modal
        open={openUpdate}
        onClose={handleCloseUpdate}
        aria-labelledby="modal-modal-title-update"
        aria-describedby="modal-modal-description-update"
      >
        <Box sx={modalStyle}>
          <Typography id="modal-modal-title-update" variant="h6" component="h2" gutterBottom sx={{ color: 'white' }}>
            Update Item
          </Typography>
          <Stack width="100%" direction={'column'} spacing={2}>
            <TextField
              id="item-name-update"
              label="Item Name"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="description-update"
              label="Description"
              variant="outlined"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="entry-date-update"
              label="Entry Date"
              type="date"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="expiry-date-update"
              label="Expiry Date"
              type="date"
              variant="outlined"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <TextField
              id="quantity-update"
              label="Quantity"
              type="number"
              variant="outlined"
              fullWidth
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              sx={{ borderRadius: '20px', bgcolor: '#2a2a2a', input: { color: 'white' } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={updateItem}
              sx={buttonStyle}
            >
              Update
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Box sx={containerStyle}>
        {/* Inventory Section */}
        <Box sx={inventoryContainerStyle}>
          <Box sx={searchBarContainerStyle}>
            <TextField
              id="search-bar"
              label="Search"
              variant="outlined"
              fullWidth
              value={searchQuery}
              onChange={handleSearch}
              sx={searchBarStyle}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleOpenAdd}
              sx={addButtonStyle}
            >
              Add New Item
            </Button>
          </Box>

          <Stack spacing={2} mt={2}>
            {filteredInventory.map((item) => (
              <Box key={item.id} sx={inventoryItemStyle}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>{item.id}</Typography>
                <Typography variant="body2" sx={{ color: 'white' }}>{item.description}</Typography>
                <Typography variant="body2" sx={{ color: 'white' }}>Entry Date: {item.entryDate}</Typography>
                <Typography variant="body2" sx={{ color: 'white' }}>Expiry Date: {item.expiryDate}</Typography>
                <Typography variant="body2" sx={{ color: 'white' }}>Quantity: {item.quantity}</Typography>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={() => handleOpenUpdate(item)}
                  sx={buttonStyle}
                >
                  Update
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => removeItem(item.id)}
                  sx={buttonStyle}
                >
                  Remove
                </Button>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Chart Section */}
        <Box sx={chartContainerStyle}>
          <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            Inventory Pie Chart
          </Typography>
          <Box sx={chartStyle}>
            <Pie data={pieData} options={pieOptions} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
