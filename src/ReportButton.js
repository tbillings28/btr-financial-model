import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import PrintableReport from './PrintableReport';

const ReportButton = ({ modelData, calculatedResults, portfolioValue, cashFlows, exitStrategy }) => {
  const [showReport, setShowReport] = useState(false);
  const componentRef = useRef(null);

  // Handle report dialog
  const openReport = () => {
    setShowReport(true);
    
    // Add class to body to prevent scrolling when modal is open
    document.body.classList.add('report-modal-open');
    
    // Log for debugging
    console.log("Report dialog opened");
    console.log("Model data:", modelData);
    console.log("Calculated results:", calculatedResults);
  };
  
  const closeReport = () => {
    setShowReport(false);
    
    // Remove body class when modal is closed
    document.body.classList.remove('report-modal-open');
    
    console.log("Report dialog closed");
  };

  return (
    <>
      <button 
        onClick={openReport}
        className="report-button"
      >
        Generate Report
      </button>
      
      {showReport && (
        <PrintableReport
          modelData={modelData}
          calculatedResults={calculatedResults}
          portfolioValue={portfolioValue}
          cashFlows={cashFlows}
          exitStrategy={exitStrategy}
          onClose={closeReport}
        />
      )}
    </>
  );
};

export default ReportButton;