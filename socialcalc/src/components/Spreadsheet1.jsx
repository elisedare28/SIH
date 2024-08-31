import React, { useState,useRef,useEffect } from 'react';
//import "../spreadsheet.css"
import Handsontable from 'handsontable';
import { HotTable } from '@handsontable/react';
import 'handsontable/dist/handsontable.full.css';
import { registerAllModules } from 'handsontable/registry';
import { HyperFormula } from 'hyperformula';
import {io} from 'socket.io-client'; // Import socket.io-client
//import {autoSizeColumns} from "./autoResizeCols.js";
registerAllModules();

const createInitialData = (rows, cols) => {
  return Array.from({ length: rows }, () => Array(cols).fill(''));
};

 const Spreadsheet = () => {
  const [data, setData] = useState(null);
  const hotTableComponent = useRef(null);
  const socket = useRef(null);

  // Initialize socket.io client
  useEffect(() => {
    const socket = io('http://localhost:3000');

    // Handle connconstection
    socket.on('connect', () => {
      console.log('Connected to WebSocket server',socket.id);
    });

    // Handle updates from the server
   /* socket.current.on('spreadsheet-update', (updatedData) => {
      console.log('Received spreadsheet update:', updatedData);
      setData(updatedData);
    });

    // Clean up on component unmount
    return () => {
      console.log('Cleaning up WebSocket connection');
      if (socket.current) {
        socket.current.disconnect();
      }
    };*/
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

   // Auto-size columns
   /*useEffect(() => {
    if (hotTableComponent.current) {
      autoSizeColumns(hotTableComponent.current);

    }
  }, [data]);*/

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

  return (
    <div className="spreadsheet-container">
      <HotTable
        ref={hotTableComponent}
        data={data}
        formulas={{
          engine: HyperFormula,
        }}
        rowHeaders={true}
        colHeaders={true}
        colWidths={100}
        height="100vh"  // Full height of the viewport
        width="100vw"   // Full width of the viewport
        licenseKey="non-commercial-and-evaluation" // For non-commercial use only
        afterChange={(changes, source) => {
          if (source === 'edit') {
            console.log('Data changed:', changes);
            const newData = [...data];
            changes.forEach(([row, col, oldValue, newValue]) => {
              newData[row][col] = newValue;
            });
            setData(newData);
            // Emit the updated data to the server
            //socket.current.emit('spreadsheet-update', newData);
          }
        }}
      />
    </div>
  );
};

export default Spreadsheet;
