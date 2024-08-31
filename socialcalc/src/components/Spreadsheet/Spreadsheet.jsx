import React, { useState, useRef, useEffect } from 'react';
import "../spreadsheet.css";
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import { io } from 'socket.io-client'; // Import socket.io-client
import FileHandler from '../FileHandler';
import { useNavigate } from 'react-router-dom';

registerAllModules();

const createInitialData = (rows, cols) => {
  return Array.from({ length: rows }, () => Array(cols).fill(''));
};

const Spreadsheet = () => {
  const [data, setData] = useState(createInitialData(100, 100));
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const hotTableComponent = useRef(null);
  const socket = useRef(null);
  const navigate = useNavigate();

  // Initialize WebSocket connection
  // Check for token and redirect if not present
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin'); // Redirect to login page if no token found
    } else {
      // Initialize WebSocket connection only if authenticated
      socket.current = io('http://localhost:3000', {
        auth: {
          token,
        },
      });
      
      socket.current.on('connect', () => {
        console.log('Connected to WebSocket server', socket.current.id);
        setCurrentUser(socket.current.id); // Set the current user ID
        socket.current.emit('user-edit', socket.current.id); // Send user ID to server
      });

      socket.current.on('update-users', (users) => {
        setUsers(users);
      });

      socket.current.on('spreadsheet-update', (update) => {
        setData(update);
      });

      socket.current.on('character-update', ({ cell, character }) => {
        const [row, col] = cell;
        setData((prevData) => {
          const newData = [...prevData];
          newData[row][col] = character;
          return newData;
        });
      });

      socket.current.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      return () => {
        if (socket.current) {
          socket.current.disconnect();
        }
      };
    }
  }, [navigate]);
  // Load data from local storage when the component mounts
  useEffect(() => {
    const savedData = window.localStorage.getItem("SpreadSheetData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) {
          setData(parsedData);
          console.log('Data successfully loaded from local storage:', parsedData);
        } else {
          console.warn('Invalid data format in local storage.');
          setData(createInitialData(100, 100));
        }
      } catch (error) {
        console.error('Error retrieving data from local storage:', error);
        setData(createInitialData(100, 100));
      }
    } else {
      console.log('No data found in local storage, initializing with default data.');
      setData(createInitialData(100, 100));
    }
  }, []);

  // Save data to local storage whenever it changes
  useEffect(() => {
    if (data !== null) {
      try {
        window.localStorage.setItem('SpreadSheetData', JSON.stringify(data));
        console.log('Data successfully saved to local storage:', data);
      } catch (error) {
        console.error('Error saving data to local storage:', error);
      }
    }
  }, [data]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (hotTableComponent.current) {
        hotTableComponent.current.hotInstance?.render();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to adjust size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle changes before they're finalized to emit character-by-character changes
  const handleBeforeChange = (changes, source) => {
    if (source === 'edit') {
      const [row, col, oldValue, newValue] = changes[0];
      // Emit character-by-character change
      if (newValue !== oldValue) {
        socket.current.emit('character-update', { cell: [row, col], character: newValue });
        setData(prevData => {
          const newData = [...prevData];
          newData[row][col] = newValue;
          return newData;
        });
      }
    }
  };

  // Update cell edit state
  const handleAfterSelection = (row, col) => {
    socket.current.emit('user-cell-update', { row, col, userId: currentUser });
  };

  const getCellClassName = (row, col) => {
    let cellClass = '';
    Object.keys(users).forEach((userId) => {
      if (users[userId].currentCell && users[userId].currentCell.row === row && users[userId].currentCell.col === col) {
        cellClass = `editing-${userId}`;
      }
    });
    return cellClass;
  };

  // Define a regular function to avoid issues with 'arguments'
  function customCellRenderer(hotInstance, td, row, col, prop, value, cellProperties) {
    Handsontable.renderers.TextRenderer.apply(this, arguments); // Use arguments correctly in a regular function
    const className = getCellClassName(row, col);
    if (className) {
      td.className += ` ${className}`;
      td.style.backgroundColor = 'yellow'; // Highlight cell in yellow
      const userEditing = Object.keys(users).find(
        (userId) => users[userId].currentCell && users[userId].currentCell.row === row && users[userId].currentCell.col === col
      );
      if (userEditing) {
        td.innerHTML += `<div style="position: absolute; top: 0; right: 0; background: red; color: white; font-size: 12px; padding: 2px;">${users[userEditing].username || userEditing}</div>`;
      }
    }
  }

  return (
    
    <div className="spreadsheet-container">
      <FileHandler data={data} setData={setData} />
      <HotTable
        ref={hotTableComponent}
        data={data}
        formulas={{ engine: HyperFormula }}
        rowHeaders={true}
        colHeaders={true}
        colWidths={100}
        height="100vh"
        width="100vw"
        licenseKey="non-commercial-and-evaluation"
        beforeChange={handleBeforeChange}
        afterSelection={(row, col) => handleAfterSelection(row, col)}
        cells={(row, col) => {
          return {
            renderer: customCellRenderer,
          };
        }}
      />
    </div>
  );
};

export default Spreadsheet;
/*
const Spreadsheet = () => {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState({});
  const [currentUser, setCurrentUser] = useState('');
  const hotTableComponent = useRef(null);
  const socket = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    socket.current = io('http://localhost:3000');
    
    socket.current.on('connect', () => {
      console.log('Connected to WebSocket server', socket.current.id);
      setCurrentUser(socket.current.id); // Set the current user ID
      socket.current.emit('user-edit', socket.current.id); // Send user ID to server
    });

    socket.current.on('update-users', (users) => {
      setUsers(users);
    });

    socket.current.on('spreadsheet-update', (update) => {
      setData(update);
    });

    socket.current.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Load data from local storage when the component mounts
  useEffect(() => {
    const savedData = window.localStorage.getItem("SpreadSheetData");
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (Array.isArray(parsedData)) {
          setData(parsedData);
          console.log('Data successfully loaded from local storage:', parsedData);
        } else {
          console.warn('Invalid data format in local storage.');
          // Initialize with default data if format is invalid
          setData(createInitialData(100, 100));
        }
      } catch (error) {
        console.error('Error retrieving data from local storage:', error);
        // Initialize with default data if an error occurs
        setData(createInitialData(100, 100));
      }
    } else {
      console.log('No data found in local storage, initializing with default data.');
      setData(createInitialData(100, 100));
    }
  }, []);

  // Save data to local storage whenever it changes
  useEffect(() => {
    if (data !== null) { // Ensure data is not null before saving
      try {
        window.localStorage.setItem('SpreadSheetData', JSON.stringify(data));
        console.log('Data successfully saved to local storage:', data);
      } catch (error) {
        console.error('Error saving data to local storage:', error);
      }
    }
  }, [data]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (hotTableComponent.current) {
        hotTableComponent.current.hotInstance?.render();
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call to adjust size

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCellChange = (changes, source) => {
    if (source === 'edit') {
      console.log('Data changed:', changes);
      const newData = [...data];
      changes.forEach(([row, col, oldValue, newValue]) => {
        newData[row][col] = newValue;
      });
      setData(newData);
      socket.current.emit('spreadsheet-update', newData);
    }
  };

  const handleBeforeChange = (changes, source) => {
    if (source === 'edit') {
      const [row, col] = changes[0];
      socket.current.emit('user-cell-update', { row, col, userId: currentUser });
    }
  };

  const getCellClassName = (row, col) => {
    // Highlight cells based on which users are editing them
    let cellClass = '';
    Object.keys(users).forEach((userId) => {
      if (users[userId].currentCell && users[userId].currentCell.row === row && users[userId].currentCell.col === col) {
        cellClass = `editing-${userId}`;
      }
    });
    return cellClass;
  };

  return (
    <div className="spreadsheet-container">
      <HotTable
        ref={hotTableComponent}
        data={data}
        formulas={{ engine: HyperFormula }}
        rowHeaders={true}
        colHeaders={true}
        colWidths={100}
        height="100vh"
        width="100vw"
        licenseKey="non-commercial-and-evaluation"
        afterChange={handleCellChange}
        beforeChange={handleBeforeChange}
        cells={(row, col) => ({
          className: getCellClassName(row, col),
        })}
      />
    </div>
  );
};

export default Spreadsheet;
*/