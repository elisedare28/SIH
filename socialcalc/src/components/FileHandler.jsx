// FileHandler.jsx
import React, { useState, useRef } from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './filehandler.css'; // Make sure to import your CSS file

const FileHandler = ({ data, setData }) => {
  const [selectedFormat, setSelectedFormat] = useState('');
  const fileInputRef = useRef(null);

  // Function to download data as CSV
  const downloadCSV = () => {
    const csvData = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet(data));
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'spreadsheet_data.csv');
  };

  // Function to download data as XLSX
  const downloadXLSX = () => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([xlsxBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'spreadsheet_data.xlsx');
  };

  // Function to download data as PDF
  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Column 1', 'Column 2', 'Column 3']], // Adjust this to reflect actual headers if needed
      body: data.map(row => row.map(cell => cell.toString())), // Convert each cell to string for PDF compatibility
    });
    doc.save('spreadsheet_data.pdf');
  };

  // Function to handle download based on selected format
  const handleDownload = () => {
    switch (selectedFormat) {
      case 'csv':
        downloadCSV();
        break;
      case 'xlsx':
        downloadXLSX();
        break;
      case 'pdf':
        downloadPDF();
        break;
      default:
        console.warn('Please select a format to download.');
    }
  };

  // Function to handle file import
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const importedData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setData(importedData);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Function to trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="navbar">
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".csv, .xlsx"
        onChange={handleFileImport}
      />
      <button onClick={triggerFileInput}>Import File</button>
      <select
        value={selectedFormat}
        onChange={(e) => setSelectedFormat(e.target.value)}
      >
        <option value="">Select format</option>
        <option value="csv">CSV</option>
        <option value="xlsx">XLSX</option>
        <option value="pdf">PDF</option>
      </select>
      <button onClick={handleDownload}>Download</button>
    </div>
  );
};

export default FileHandler;