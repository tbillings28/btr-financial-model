import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './PrintableReport.css';

const PrintableReport = ({ 
  modelData, 
  calculatedResults, 
  portfolioValue, 
  cashFlows,
  exitStrategy,
  onClose 
}) => {
  const componentRef = useRef();
  
  // Enhanced print handler with landscape orientation
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: 'BTR Financial Model Report',
    onBeforeGetContent: () => {
      console.log("Preparing document for print...");
      return Promise.resolve();
    },
    onPrintError: (error) => {
      console.error("Print error:", error);
      alert("There was an error printing. Please try again or save as PDF from your browser's print dialog.");
    },
    onAfterPrint: () => {
      console.log("Print completed successfully");
    },
    pageStyle: '@page { size: landscape; margin: 20mm; }',
    removeAfterPrint: true,
    copyStyles: true,
  });

  // Enhanced PDF download functionality with landscape orientation and loading indicator
  const downloadAsPDF = () => {
    const report = componentRef.current;
    
    // Show loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.style.position = 'fixed';
    loadingElement.style.top = '50%';
    loadingElement.style.left = '50%';
    loadingElement.style.transform = 'translate(-50%, -50%)';
    loadingElement.style.backgroundColor = 'rgba(0,0,0,0.7)';
    loadingElement.style.color = 'white';
    loadingElement.style.padding = '20px';
    loadingElement.style.borderRadius = '10px';
    loadingElement.style.zIndex = '9999';
    loadingElement.textContent = 'Generating PDF... Please wait.';
    document.body.appendChild(loadingElement);
    
    // Create PDF with multiple pages if needed in landscape
    setTimeout(() => {
      html2canvas(report, { 
        scale: 1.5, 
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        // A4 size in landscape orientation (297mm x 210mm)
        const pdf = new jsPDF('l', 'mm', 'a4');
        const imgWidth = 277; // A4 width with margins
        const imgHeight = canvas.height * imgWidth / canvas.width;
        const pageHeight = 190; // A4 height with margins
        
        let heightLeft = imgHeight;
        let position = 10; // Initial margin
        
        // Add first page
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if needed
        while (heightLeft > 0) {
          position = heightLeft - imgHeight; // Negative so it shows the next part
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save('BTR_Financial_Report.pdf');
        
        // Remove loading indicator
        document.body.removeChild(loadingElement);
      });
    }, 500);
  };

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage values
  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(2)}%`;
  };

  // Format date as month/day/year
  const formatDate = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US');
  };

  // Improved chart colors for better visibility in dark mode
  const getChartColors = () => {
    return {
      portfolioValue: "#00A3FF", // Brighter blue for portfolio value
      portfolioCost: "#FF5252",  // Brighter red for costs
      portfolioDebt: "#FFD600",  // Brighter yellow for debt
      lpEquity: "#00E676",       // Brighter green for equity
      noi: "#00C853",            // Bright green for NOI
      debtService: "#D500F9",    // Bright purple for debt service
      lpDistribution: "#FFC400"  // Bright amber for LP distribution
    };
  };

  const chartColors = getChartColors();

  // Prepare data for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
  const pieData = [
    { name: 'Land Cost', value: modelData.landCostPerHome * modelData.totalHomes },
    { name: 'Construction Cost', value: modelData.constructionCostPerHome * modelData.totalHomes },
    { name: 'Acquisition Costs', value: calculatedResults.totalAcquisitionCosts },
    { name: 'Financing Costs', value: calculatedResults.totalFinancingCosts || 0 },
    { name: 'Other Costs', value: modelData.otherCostsPerHome * modelData.totalHomes || 0 },
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-dialog">
        <div className="printable-report-container light-mode-forced">
          <div className="print-controls">
            <button onClick={handlePrint} className="print-button">Print Report</button>
            <button onClick={downloadAsPDF} className="download-button">Download PDF</button>
            <button onClick={onClose} className="close-button">Close</button>
          </div>
          
          <div className="report-content" ref={componentRef}>
            {/* Enhanced header with decorative line */}
            <div className="report-header">
              <h1>BTR Investment Financial Analysis</h1>
              <p className="report-date">Generated on: {formatDate()}</p>
              <div className="report-header-line"></div>
            </div>

            {/* Project Overview section with improved spacing */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Project Overview</h2>
                <div className="section-line"></div>
              </div>
              <div className="grid-container">
                <div className="grid-item">
                  <h3>Portfolio Structure</h3>
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ width: "60%" }}>Investment Type:</td>
                        <td style={{ width: "40%" }}>Build-to-Rent (BTR)</td>
                      </tr>
                      <tr>
                        <td>Fund Structure:</td>
                        <td>{modelData.fundStructure || 'Standard'}</td>
                      </tr>
                      <tr>
                        <td>Total Homes:</td>
                        <td>{modelData.totalHomes}</td>
                      </tr>
                      <tr>
                        <td>3-Bed Homes:</td>
                        <td>{modelData.threeBedHomes || 0}</td>
                      </tr>
                      <tr>
                        <td>4-Bed Homes:</td>
                        <td>{modelData.fourBedHomes || 0}</td>
                      </tr>
                      <tr>
                        <td>Investment Timeline:</td>
                        <td>{modelData.investmentYears || 5} years</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="grid-item">
                  <h3>Financial Summary</h3>
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ width: "60%" }}>Total Investment:</td>
                        <td style={{ width: "40%" }}>{formatCurrency(calculatedResults.totalInvestment)}</td>
                      </tr>
                      <tr>
                        <td>IRR:</td>
                        <td>{formatPercentage(calculatedResults.irr)}</td>
                      </tr>
                      <tr>
                        <td>Cash-on-Cash Return:</td>
                        <td>{formatPercentage(calculatedResults.cashOnCashReturn)}</td>
                      </tr>
                      <tr>
                        <td>Cap Rate:</td>
                        <td>{formatPercentage(calculatedResults.capRate)}</td>
                      </tr>
                      <tr>
                        <td>Equity Multiple:</td>
                        <td>{calculatedResults.equityMultiple?.toFixed(2)}x</td>
                      </tr>
                      <tr>
                        <td>Payback Period:</td>
                        <td>{calculatedResults.paybackPeriod?.toFixed(1)} years</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Cost Breakdown section with improved pie chart */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Cost Breakdown</h2>
                <div className="section-line"></div>
              </div>
              <div className="grid-container">
                <div className="grid-item chart-container pie-chart-container">
                  <h3 className="chart-title">Cost Distribution</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={false} // Remove direct labels to prevent overlap
                        paddingAngle={2}
                      >
                        {pieData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            stroke="white"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => formatCurrency(value)} 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', color: '#333' }}
                        itemStyle={{ color: '#333' }}
                        labelStyle={{ color: '#333', fontWeight: 'bold' }}
                      />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right"
                        formatter={(value, entry, index) => `${value} (${((pieData[index].value / pieData.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%)`}
                        wrapperStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #eee', 
                          borderRadius: '3px', 
                          padding: '10px', 
                          color: '#333',
                          right: 0,
                          width: 180
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid-item">
                  <h3>Cost Details</h3>
                  <table>
                    <tbody>
                      <tr>
                        <td style={{ width: "60%" }}>Land Cost per Home:</td>
                        <td style={{ width: "40%" }}>{formatCurrency(modelData.landCostPerHome)}</td>
                      </tr>
                      <tr>
                        <td>Construction Cost per Home:</td>
                        <td>{formatCurrency(modelData.constructionCostPerHome)}</td>
                      </tr>
                      <tr>
                        <td>Total Acquisition Costs:</td>
                        <td>{formatCurrency(calculatedResults.totalAcquisitionCosts)}</td>
                      </tr>
                      <tr>
                        <td>Total Financing Costs:</td>
                        <td>{formatCurrency(calculatedResults.totalFinancingCosts || 0)}</td>
                      </tr>
                      <tr>
                        <td>Other Costs per Home:</td>
                        <td>{formatCurrency(modelData.otherCostsPerHome || 0)}</td>
                      </tr>
                      <tr>
                        <td>Total Project Cost:</td>
                        <td>{formatCurrency(calculatedResults.totalProjectCost)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Financing section */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Financing</h2>
                <div className="section-line"></div>
              </div>
              <table className="full-width-table">
                <tbody>
                  <tr>
                    <td style={{ width: "60%" }}>Loan-to-Cost (LTC):</td>
                    <td style={{ width: "40%" }}>{formatPercentage(modelData.ltc || 0.7)}</td>
                  </tr>
                  <tr>
                    <td>Loan Amount:</td>
                    <td>{formatCurrency(calculatedResults.loanAmount)}</td>
                  </tr>
                  <tr>
                    <td>Equity Requirement:</td>
                    <td>{formatCurrency(calculatedResults.equityAmount)}</td>
                  </tr>
                  <tr>
                    <td>Interest Rate:</td>
                    <td>{formatPercentage(modelData.interestRate || 0.055)}</td>
                  </tr>
                  <tr>
                    <td>Loan Term:</td>
                    <td>{modelData.loanTerm || 30} years</td>
                  </tr>
                  <tr>
                    <td>Annual Debt Service:</td>
                    <td>{formatCurrency(calculatedResults.annualDebtService)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Rental Income section */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Rental Income</h2>
                <div className="section-line"></div>
              </div>
              <table className="full-width-table rental-income-table">
                <thead>
                  <tr>
                    <th style={{ width: "20%" }}>Property Type</th>
                    <th style={{ width: "10%" }}>Units</th>
                    <th style={{ width: "15%" }}>Monthly Rent</th>
                    <th style={{ width: "15%" }}>Annual Rent</th>
                    <th style={{ width: "15%" }}>Occupancy</th>
                    <th style={{ width: "25%" }}>Effective Gross Income</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>3-Bedroom Homes</td>
                    <td>{modelData.threeBedHomes || 0}</td>
                    <td>{formatCurrency(modelData.threeBedRent || 0)}</td>
                    <td>{formatCurrency((modelData.threeBedRent || 0) * 12)}</td>
                    <td>{formatPercentage(modelData.occupancyRate || 0.95)}</td>
                    <td>{formatCurrency(calculatedResults.threeBedAnnualIncome || 0)}</td>
                  </tr>
                  <tr>
                    <td>4-Bedroom Homes</td>
                    <td>{modelData.fourBedHomes || 0}</td>
                    <td>{formatCurrency(modelData.fourBedRent || 0)}</td>
                    <td>{formatCurrency((modelData.fourBedRent || 0) * 12)}</td>
                    <td>{formatPercentage(modelData.occupancyRate || 0.95)}</td>
                    <td>{formatCurrency(calculatedResults.fourBedAnnualIncome || 0)}</td>
                  </tr>
                  <tr className="total-row">
                    <td colSpan="5">Total Annual Rental Income:</td>
                    <td>{formatCurrency(calculatedResults.totalAnnualIncome)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Operating Expenses section */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Operating Expenses</h2>
                <div className="section-line"></div>
              </div>
              <table className="full-width-table expenses-table">
                <tbody>
                  <tr>
                    <td style={{ width: "40%" }}>Property Management:</td>
                    <td style={{ width: "35%" }}>{formatPercentage(modelData.propertyManagementFee || 0.08)} of rental income</td>
                    <td style={{ width: "25%" }}>{formatCurrency(calculatedResults.annualPropertyManagement)}</td>
                  </tr>
                  <tr>
                    <td>Maintenance:</td>
                    <td>{formatPercentage(modelData.maintenanceCosts || 0.05)} of rental income</td>
                    <td>{formatCurrency(calculatedResults.annualMaintenance)}</td>
                  </tr>
                  <tr>
                    <td>Property Taxes:</td>
                    <td>{formatPercentage(modelData.propertyTaxRate || 0.01)} of property value</td>
                    <td>{formatCurrency(calculatedResults.annualPropertyTaxes)}</td>
                  </tr>
                  <tr>
                    <td>Insurance:</td>
                    <td>{formatCurrency(modelData.insuranceCostPerHome || 1200)} per home annually</td>
                    <td>{formatCurrency(calculatedResults.annualInsurance)}</td>
                  </tr>
                  <tr>
                    <td>HOA Fees:</td>
                    <td>{formatCurrency(modelData.hoaFeesPerHome || 0)} per home annually</td>
                    <td>{formatCurrency(calculatedResults.annualHOAFees || 0)}</td>
                  </tr>
                  <tr>
                    <td>Vacancy Loss:</td>
                    <td>Based on {formatPercentage(1 - (modelData.occupancyRate || 0.95))} vacancy rate</td>
                    <td>{formatCurrency(calculatedResults.annualVacancyLoss)}</td>
                  </tr>
                  <tr>
                    <td>Other Expenses:</td>
                    <td>&nbsp;</td>
                    <td>{formatCurrency(calculatedResults.otherAnnualExpenses || 0)}</td>
                  </tr>
                  <tr className="total-row">
                    <td>Total Operating Expenses:</td>
                    <td>&nbsp;</td>
                    <td>{formatCurrency(calculatedResults.totalOperatingExpenses)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cash Flow Analysis section with improved chart */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Cash Flow Analysis</h2>
                <div className="section-line"></div>
              </div>
              <div className="chart-container" style={{ height: "400px" }}>
                <h3 className="chart-title">Annual Cash Flow Projection</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={cashFlows}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis 
                      dataKey="year" 
                      angle={0} 
                      tick={{ fill: "#333", fontSize: 12 }} 
                      tickLine={{ stroke: "#333" }}
                      axisLine={{ stroke: "#333" }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000)}k`} 
                      tick={{ fill: "#333", fontSize: 12 }}
                      tickLine={{ stroke: "#333" }}
                      axisLine={{ stroke: "#333" }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)} 
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #ccc", 
                        borderRadius: "4px",
                        color: "#333"
                      }}
                      labelStyle={{ color: "#333", fontWeight: "bold" }}
                      itemStyle={{ color: "#333" }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      wrapperStyle={{ 
                        color: "#333", 
                        backgroundColor: "white",
                        padding: "10px",
                        border: "1px solid #eee",
                        borderRadius: "4px"
                      }}
                    />
                    <Bar dataKey="netOperatingIncome" name="NOI" fill={chartColors.noi} stroke="#007E33" strokeWidth={1} />
                    <Bar dataKey="debtService" name="Debt Service" fill={chartColors.debtService} stroke="#9500AE" strokeWidth={1} />
                    <Bar dataKey="cashFlow" name="Cash Flow" fill={chartColors.lpDistribution} stroke="#FFAB00" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <table className="full-width-table cash-flow-table">
                <thead>
                  <tr>
                    <th style={{ width: "10%" }}>Year</th>
                    <th style={{ width: "15%" }}>Gross Income</th>
                    <th style={{ width: "15%" }}>Operating Expenses</th>
                    <th style={{ width: "15%" }}>NOI</th>
                    <th style={{ width: "15%" }}>Debt Service</th>
                    <th style={{ width: "15%" }}>Cash Flow</th>
                    <th style={{ width: "15%" }}>Cash Flow Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlows.map((yearData) => (
                    <tr key={yearData.year}>
                      <td>Year {yearData.year}</td>
                      <td>{formatCurrency(yearData.grossIncome)}</td>
                      <td>{formatCurrency(yearData.operatingExpenses)}</td>
                      <td>{formatCurrency(yearData.netOperatingIncome)}</td>
                      <td>{formatCurrency(yearData.debtService)}</td>
                      <td>{formatCurrency(yearData.cashFlow)}</td>
                      <td>{formatPercentage(yearData.cashFlowYield)}</td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="4">Average Annual Cash Flow:</td>
                    <td colSpan="3">{formatCurrency(
                      cashFlows.reduce((sum, year) => sum + year.cashFlow, 0) / cashFlows.length
                    )}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Exit Strategy Analysis section - Only show the selected exit strategy */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Exit Strategy Analysis</h2>
                <div className="section-line"></div>
              </div>
              
              {modelData.exitStrategy === "portfolio" ? (
                <div className="grid-container single-grid">
                  <div className="grid-item">
                    <h3>Portfolio Sale</h3>
                    <table>
                      <tbody>
                        <tr>
                          <td style={{ width: "60%" }}>Exit Cap Rate:</td>
                          <td style={{ width: "40%" }}>{formatPercentage(exitStrategy.portfolioSale.exitCapRate)}</td>
                        </tr>
                        <tr>
                          <td>Estimated Exit Value:</td>
                          <td>{formatCurrency(exitStrategy.portfolioSale.exitValue)}</td>
                        </tr>
                        <tr>
                          <td>Transaction Costs:</td>
                          <td>{formatCurrency(exitStrategy.portfolioSale.transactionCosts)}</td>
                        </tr>
                        <tr>
                          <td>Remaining Loan Balance:</td>
                          <td>{formatCurrency(exitStrategy.portfolioSale.remainingLoanBalance)}</td>
                        </tr>
                        <tr>
                          <td>Net Proceeds:</td>
                          <td>{formatCurrency(exitStrategy.portfolioSale.netProceeds)}</td>
                        </tr>
                        <tr>
                          <td>Estimated IRR:</td>
                          <td>{formatPercentage(exitStrategy.portfolioSale.estimatedIRR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid-container single-grid">
                  <div className="grid-item">
                    <h3>Individual Home Sales</h3>
                    <table>
                      <tbody>
                        <tr>
                          <td style={{ width: "60%" }}>Average Home Price:</td>
                          <td style={{ width: "40%" }}>{formatCurrency(exitStrategy.individualSales.averageHomePrice)}</td>
                        </tr>
                        <tr>
                          <td>Total Sales Value:</td>
                          <td>{formatCurrency(exitStrategy.individualSales.totalSalesValue)}</td>
                        </tr>
                        <tr>
                          <td>Average Transaction Cost:</td>
                          <td>{formatPercentage(exitStrategy.individualSales.transactionCostPercent)}</td>
                        </tr>
                        <tr>
                          <td>Total Transaction Costs:</td>
                          <td>{formatCurrency(exitStrategy.individualSales.totalTransactionCosts)}</td>
                        </tr>
                        <tr>
                          <td>Net Proceeds:</td>
                          <td>{formatCurrency(exitStrategy.individualSales.netProceeds)}</td>
                        </tr>
                        <tr>
                          <td>Estimated IRR:</td>
                          <td>{formatPercentage(exitStrategy.individualSales.estimatedIRR)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Portfolio Value Projection section with improved chart */}
            <div className="report-section with-separator page-break-after">
              <div className="section-header">
                <h2>Portfolio Value Projection</h2>
                <div className="section-line"></div>
              </div>
              <div className="chart-container" style={{ height: "400px" }}>
                <h3 className="chart-title">Portfolio Value Over Time</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={portfolioValue}
                    margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                    <XAxis 
                      dataKey="year" 
                      angle={0} 
                      tick={{ fill: "#333", fontSize: 12 }}
                      tickLine={{ stroke: "#333" }}
                      axisLine={{ stroke: "#333" }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                      tick={{ fill: "#333", fontSize: 12 }}
                      tickLine={{ stroke: "#333" }}
                      axisLine={{ stroke: "#333" }}
                    />
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: "white", 
                        border: "1px solid #ccc", 
                        borderRadius: "4px",
                        color: "#333"
                      }}
                      labelStyle={{ color: "#333", fontWeight: "bold" }}
                      itemStyle={{ color: "#333" }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36}
                      wrapperStyle={{ 
                        color: "#333", 
                        backgroundColor: "white",
                        padding: "10px",
                        border: "1px solid #eee",
                        borderRadius: "4px"
                      }}
                    />
                    <Bar dataKey="value" name="Portfolio Value" fill={chartColors.portfolioValue} stroke="#0077CB" strokeWidth={1} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
  
{/* Risk Analysis section */}
<div className="report-section with-separator">
              <div className="section-header">
                <h2>Risk Analysis</h2>
                <div className="section-line"></div>
              </div>
              <table className="full-width-table">
                <tbody>
                  <tr>
                    <td style={{ width: "60%" }}><strong>Break-even Occupancy:</strong></td>
                    <td style={{ width: "40%" }}>{formatPercentage(calculatedResults.breakEvenOccupancy || 0.85)}</td>
                  </tr>
                  <tr>
                    <td><strong>Debt Service Coverage Ratio:</strong></td>
                    <td>{calculatedResults.debtServiceCoverageRatio?.toFixed(2) || '1.25'}</td>
                  </tr>
                  <tr>
                    <td><strong>Sensitivity to 1% Interest Rate Increase:</strong></td>
                    <td>{formatCurrency(calculatedResults.interestRateSensitivity || 0)}</td>
                  </tr>
                  <tr>
                    <td><strong>Sensitivity to 5% Decrease in Rental Income:</strong></td>
                    <td>{formatCurrency(calculatedResults.rentalIncomeSensitivity || 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            {/* Enhanced footer with separator line */}
            <div className="report-footer">
              <div className="footer-line"></div>
              <div className="footer-content">
                <p>This report is generated for informational purposes only and should not be considered as financial advice. 
                All projections are estimates based on the provided inputs and assumptions. Actual results may vary.</p>
                <p>© {new Date().getFullYear()} BTR Financial Model</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintableReport;
