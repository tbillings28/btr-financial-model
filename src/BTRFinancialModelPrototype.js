import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Area, AreaChart } from 'recharts';

// Add explicit styling for deployment environments
import './BTRFinancialModel.css'; // Make sure this points to the updated CSS file
import ReportButton from './ReportButton';

const BTRFinancialModelPrototype = () => {
  // Add theme state
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode to match investor presentation
  
  // Enhanced state for inputs
  const [inputs, setInputs] = useState({
    // Fund Structure
    phase1Homes: 500,
    phase1Bed3: 250,
    phase1Bed4: 250,
    preferredReturn: 0.08,
    lpSplit: 0.80,
    gpSplit: 0.20,
    
    // Development Timeline
    constructionPeriodMonths: 12,
    absorptionRatePerMonth: 40, // Homes delivered per month
    
    // Construction and Land Costs
    landCostPerHome: 40000, // Cost of land per home
    landDevelopmentCostPerHome: 25000, // Site preparation, infrastructure, etc.
    constructionCost3Bed: 180000, // Factory-built cost for 3-bed
    constructionCost4Bed: 245000, // Factory-built cost for 4-bed
    developmentFee: 0.04, // 4% of total development cost
    
    // Financing
    permanentLoanToValue: 0.70, // Permanent financing LTV
    interestRate: 0.055,
    interestOnly: true,
    interestOnlyPeriod: 10,
    constructionLoanRate: 0.065, // Construction loan interest rate if needed
    
    // Appreciation & Growth
    homePriceAppreciation: 0.03,
    
    // Property - 3 Bed
    acquisitionPrice3Bed: 240000,
    marketValue3Bed: 310000,
    monthlyRent3Bed: 2100,
    
    // Property - 4 Bed
    acquisitionPrice4Bed: 311695,
    marketValue4Bed: 360000,
    monthlyRent4Bed: 2400,
    
    // Operating
    annualRentGrowth: 0.03,
    vacancyRate: 0.05,
    leaseupPeriodMonths: 2, // Average time to lease up a home after completion
    
    // Operating Expense inputs
    propertyManagementFee: 0.08, // 8% of rental income
    maintenanceCost: 0.05,       // 5% of rental income
    propertyTaxRate: 0.01,       // 1% of property value
    insuranceCostPerHome: 1200,  // $1,200 per home annually
    hoaFeesPerHome: 0,           // $0 per home annually
    otherExpensesPerHome: 0,     // $0 per home annually
    
    // Exit
    holdPeriodYears: 7,
    exitStrategy: "portfolio",
    portfolioExitCapRate: 0.055,
    brokerageFee: 0.05,
    individualSalesPremium: 0.05
  });
  
  // State for calculated results
  const [results, setResults] = useState({
    acquisitionSummary: {},
    cashFlows: [],
    constructionCashFlows: [], // New: Monthly cash flows during construction
    exitSummary: {},
    returns: {},
    portfolioValueChartData: [],
    equityRequirementData: [] // New: Track equity requirement over time
  });
  
  // Toggle between dark and light mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // IRR calculation function
  const calculateIRR = (cashFlows) => {
    // Implementation here
    return 0.15; // Placeholder
  };
  
  // Calculate remaining loan balance function
  const calculateRemainingLoanBalance = (principal, rate, termYears, elapsedYears) => {
    // Implementation here
    return principal; // Placeholder
  };
  
  // Calculate results whenever inputs change
  useEffect(() => {
    // Main calculation function
    const calculateResults = () => {
      // Implementation here
    };
    
    calculateResults();
  }, [inputs]);
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value;
    
    // Convert numeric inputs to numbers
    if (name !== 'exitStrategy') {
      parsedValue = parseFloat(value);
    }
    
    setInputs(prev => ({
      ...prev,
      [name]: parsedValue
    }));
  };
  
  // Handle LP/GP split change
  const handleSplitChange = (e) => {
    const lpSplitValue = parseFloat(e.target.value);
    setInputs(prev => ({
      ...prev,
      lpSplit: lpSplitValue,
      gpSplit: 1 - lpSplitValue // GP gets the remainder
    }));
  };
  
  // Updated formatCurrency function with option for short format
  const formatCurrency = (value, short = false) => {
    if (short && Math.abs(value) >= 1000000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1
      }).format(value);
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  // Format percentage
  const formatPercent = (value) => {
    return (value * 100).toFixed(2) + '%';
  };
  
  // Prepare data for charts
  const cashFlowChartData = results.cashFlows.map(year => ({
    year: `Year ${year.year}`,
    noi: year.noi || 0,
    debtService: year.debtService || 0,
    lpDistribution: year.lpDistribution || 0
  }));
  
  // LineChart custom colors for dark mode
  const getChartColors = () => {
    return {
      portfolioValue: "#5aB6BF", // USDV teal for portfolio value
      portfolioCost: "#ED8686",  // Soft red for costs
      portfolioDebt: "#F5D776",  // Soft yellow for debt
      lpEquity: "#7BE495",       // Soft green for equity
      noi: "#5aB6BF",            // USDV teal for NOI
      debtService: "#ED8686",    // Soft red for debt service
      lpDistribution: "#7BE495", // Soft green for LP distribution
      equityDeployed: "#5aB6BF", // Teal for equity
      permanentDebt: "#F5D776",  // Yellow for debt
      homesCompleted: "#7BE495", // Green for completed homes
      rentalIncome: "#ED8686"    // Red for rental income
    };
  };
  
  const chartColors = getChartColors();
  
  // Prepare data for the ReportButton component
  const modelData = {
    fundStructure: "USDV BTR Opportunity Fund",
    totalHomes: inputs.phase1Homes,
    threeBedHomes: inputs.phase1Bed3,
    fourBedHomes: inputs.phase1Bed4,
    investmentYears: inputs.holdPeriodYears,
    landCostPerHome: inputs.landCostPerHome,
    developmentCostPerHome: inputs.landDevelopmentCostPerHome,
    constructionCost3Bed: inputs.constructionCost3Bed,
    constructionCost4Bed: inputs.constructionCost4Bed,
    constructionPeriodMonths: inputs.constructionPeriodMonths,
    absorptionRatePerMonth: inputs.absorptionRatePerMonth,
    threeBedRent: inputs.monthlyRent3Bed,
    fourBedRent: inputs.monthlyRent4Bed,
    occupancyRate: 1 - inputs.vacancyRate,
    ltv: inputs.permanentLoanToValue,
    interestRate: inputs.interestRate,
    loanTerm: 30, // Placeholder value
    
    // Add these new properties
    propertyManagementFee: inputs.propertyManagementFee,
    maintenanceCosts: inputs.maintenanceCost,
    propertyTaxRate: inputs.propertyTaxRate,
    insuranceCostPerHome: inputs.insuranceCostPerHome,
    hoaFeesPerHome: inputs.hoaFeesPerHome,
    otherExpensesPerHome: inputs.otherExpensesPerHome,
    exitStrategy: inputs.exitStrategy, // Important for conditional report rendering
    peakEquityRequired: results.returns.peakEquity || 0
  };
  
  const calculatedResults = {
    totalInvestment: results.acquisitionSummary.equityRequired || 0,
    peakEquity: results.returns.peakEquity || 0,
    irr: results.returns.irr || 0,
    cashOnCashReturn: (results.returns.averageAnnualCashYield || 0) / 100,
    capRate: results.cashFlows && results.cashFlows.length > 0 ? 
             results.cashFlows[0].noi / results.portfolioValueChartData[0].portfolioValue : 0,
    equityMultiple: results.returns.equityMultiple || 0,
    paybackPeriod: 5, // Placeholder value
    totalAcquisitionCosts: results.acquisitionSummary.totalAcquisitionCost || 0,
    landCosts: results.acquisitionSummary.landCost || 0,
    landDevelopmentCosts: results.acquisitionSummary.landDevelopmentCost || 0,
    constructionCosts: results.acquisitionSummary.constructionCost || 0,
    developmentFee: results.acquisitionSummary.developmentFee || 0,
    loanAmount: results.acquisitionSummary.loanAmount || 0,
    equityAmount: results.acquisitionSummary.equityRequired || 0,
    annualDebtService: results.acquisitionSummary.annualInterestOnlyPayment || 0,
    threeBedAnnualIncome: inputs.phase1Bed3 * inputs.monthlyRent3Bed * 12 * (1 - inputs.vacancyRate),
    fourBedAnnualIncome: inputs.phase1Bed4 * inputs.monthlyRent4Bed * 12 * (1 - inputs.vacancyRate),
    totalAnnualIncome: results.cashFlows && results.cashFlows.length > 0 ? 
                      results.cashFlows[0].rentalIncome : 0,
    
    // Operating expenses
    annualPropertyManagement: results.cashFlows && results.cashFlows.length > 0 ? 
                             results.cashFlows[0].rentalIncome * inputs.propertyManagementFee : 0,
    annualMaintenance: results.cashFlows && results.cashFlows.length > 0 ? 
                      results.cashFlows[0].rentalIncome * inputs.maintenanceCost : 0,
    annualPropertyTaxes: results.portfolioValueChartData && results.portfolioValueChartData.length > 0 ? 
                        results.portfolioValueChartData[0].portfolioValue * inputs.propertyTaxRate : 0,
    annualInsurance: inputs.phase1Homes * inputs.insuranceCostPerHome,
    annualHOAFees: inputs.phase1Homes * inputs.hoaFeesPerHome,
    otherAnnualExpenses: inputs.phase1Homes * inputs.otherExpensesPerHome,
    
    annualVacancyLoss: results.cashFlows && results.cashFlows.length > 0 ? 
                      results.cashFlows[0].rentalIncome * inputs.vacancyRate / (1 - inputs.vacancyRate) : 0,
    totalOperatingExpenses: results.cashFlows && results.cashFlows.length > 0 ? 
                           results.cashFlows[0].operatingExpenses : 0,
    breakEvenOccupancy: 0.85, // Placeholder value
    debtServiceCoverageRatio: results.cashFlows && results.cashFlows.length > 0 ? 
                             results.cashFlows[0].dscr : 0,
    constructionPeriod: inputs.constructionPeriodMonths
  };
  
  // Prepare exit strategy data
  const exitStrategy = {
    portfolioSale: {
      exitCapRate: inputs.portfolioExitCapRate,
      exitValue: results.exitSummary.grossSaleProceeds || 0,
      transactionCosts: results.exitSummary.sellingCosts || 0,
      remainingLoanBalance: results.exitSummary.remainingLoanBalance || 0,
      netProceeds: results.exitSummary.netProceedsAfterDebt || 0,
      estimatedIRR: results.returns.irr || 0
    },
    individualSales: {
      averageHomePrice: (results.exitSummary.grossSaleProceeds || 0) / inputs.phase1Homes,
      totalSalesValue: results.exitSummary.grossSaleProceeds || 0,
      transactionCostPercent: inputs.brokerageFee,
      totalTransactionCosts: results.exitSummary.sellingCosts || 0,
      netProceeds: results.exitSummary.netProceedsAfterDebt || 0,
      estimatedIRR: results.returns.irr || 0
    }
  };
  
  // Convert portfolio value chart data to format needed for ReportButton
  const portfolioValue = results.portfolioValueChartData.map(item => ({
    year: item.year ? item.year.replace('Year ', '') : '',
    value: item.portfolioValue || 0
  }));
  
  // Convert cash flows to the format needed for ReportButton
  const cashFlows = results.cashFlows.map(yearData => ({
    year: yearData.year || 0,
    grossIncome: yearData.rentalIncome || 0,
    operatingExpenses: yearData.operatingExpenses || 0,
    netOperatingIncome: yearData.noi || 0,
    debtService: yearData.debtService || 0,
    cashFlow: yearData.cashFlowAfterDebtService || 0,
    cashFlowYield: yearData.cashYield ? yearData.cashYield / 100 : 0
  }));
  
  // Prepare construction phase data for ReportButton
  const constructionPhase = results.constructionCashFlows.map(month => ({
    month: month.month || 0,
    homesCompleted: month.cumulativeHomesCompleted || 0,
    equityDeployed: month.cumulativeEquityDeployed || 0,
    permanentDebt: month.cumulativePermanentDebt || 0,
    monthlyRental: month.cumulativeRentalIncome || 0
  }));
  
  return (
    <div className={`btr-container ${!isDarkMode ? 'btr-light-mode' : ''}`}>
      <button onClick={toggleTheme} className="btr-theme-toggle">
        {isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      </button>
      
      <h1 className="btr-title">USDV BTR Financial Model</h1>
      <ReportButton 
        modelData={modelData}
        calculatedResults={calculatedResults}
        portfolioValue={portfolioValue}
        cashFlows={cashFlows}
        exitStrategy={exitStrategy}
        constructionPhase={constructionPhase}
      />
      
      {/* Responsive grid layout with 2 cards per row */}
      <div className="btr-grid">
        {/* ROW 1: Fund Structure and Property Details */}
        <div className="btr-card">
          <h2 className="btr-section-title">Fund Structure</h2>
          <div className="btr-input-group">
            <label className="btr-label">Total Homes</label>
            <input
              type="number"
              name="phase1Homes"
              value={inputs.phase1Homes}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
        
        {/* Exit Summary */}
        <div className="btr-card btr-full-width">
          <h2 className="btr-section-title">Exit Summary</h2>
          <div className="btr-table-container">
            <table className="btr-table">
              <tbody>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Gross Sale Proceeds</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.grossSaleProceeds || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Selling Costs</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.sellingCosts || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Net Sale Proceeds</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.netSaleProceeds || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Remaining Loan Balance</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.remainingLoanBalance || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Net Proceeds After Debt</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.netProceedsAfterDebt || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Return of Capital</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.returnOfCapital || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">Preferred Return</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.preferredReturnAtExit || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">LP Profit Share</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.lpProfit || 0)}</td>
                </tr>
                <tr className="btr-table-row">
                  <td className="btr-table-cell">GP Profit Share</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.gpProfit || 0)}</td>
                </tr>
                <tr className="btr-row-highlight">
                  <td className="btr-table-cell">Total to LPs</td>
                  <td className="btr-table-cell">{formatCurrency(results.exitSummary.totalToLPs || 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer with branding */}
        <div className="btr-card btr-full-width" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <p>USDV BTR Opportunity Fund</p>
          <p className="btr-note">Factory-Built Homes: Faster Construction, Higher Quality, and Superior Returns.</p>
        </div>
      </div>
    </div>
  );
};

export default BTRFinancialModelPrototype;
        
        {/* Construction Cash Flow Table */}
        <div className="btr-card btr-full-width">
          <h2 className="btr-section-title">Construction Phase Monthly Cash Flows</h2>
          <div className="btr-table-container">
            <table className="btr-table">
              <thead>
                <tr className="btr-table-header">
                  <th className="btr-table-cell">Month</th>
                  <th className="btr-table-cell">Homes Started</th>
                  <th className="btr-table-cell">Homes Completed</th>
                  <th className="btr-table-cell">Monthly Costs</th>
                  <th className="btr-table-cell">Cumulative Cost</th>
                  <th className="btr-table-cell">Permanent Debt</th>
                  <th className="btr-table-cell">Rental Income</th>
                  <th className="btr-table-cell">Equity Required</th>
                </tr>
              </thead>
              <tbody>
                {results.constructionCashFlows.map((month, index) => (
                  index % 3 === 0 && ( // Show every 3rd month to save space
                    <tr key={month.month} className="btr-table-row">
                      <td className="btr-table-cell">Month {month.month}</td>
                      <td className="btr-table-cell">{month.homesStarted || 0}</td>
                      <td className="btr-table-cell">{month.cumulativeHomesCompleted || 0}</td>
                      <td className="btr-table-cell">{formatCurrency(month.totalCost || 0)}</td>
                      <td className="btr-table-cell">{formatCurrency((month.landDevelopmentCost || 0) + 
                                                      (month.constructionCost || 0) + 
                                                      (month.developmentFee || 0))}</td>
                      <td className="btr-table-cell">{formatCurrency(month.cumulativePermanentDebt || 0)}</td>
                      <td className="btr-table-cell">{formatCurrency((month.cumulativeRentalIncome || 0) * 12)}</td>
                      <td className="btr-table-cell">{formatCurrency(month.cumulativeEquityDeployed || 0)}</td>
                    </tr>
                  )
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Cash Flow Details */}
        <div className="btr-card btr-full-width">
          <h2 className="btr-section-title">Annual Operating Cash Flow Details</h2>
          <div className="btr-table-container">
            <table className="btr-table">
              <thead>
                <tr className="btr-table-header">
                  <th className="btr-table-cell">Year</th>
                  <th className="btr-table-cell">NOI</th>
                  <th className="btr-table-cell">Debt Service</th>
                  <th className="btr-table-cell">DSCR</th>
                  <th className="btr-table-cell">Preferred Return</th>
                  <th className="btr-table-cell">LP Distribution</th>
                  <th className="btr-table-cell">Cash Yield</th>
                </tr>
              </thead>
              <tbody>
                {results.cashFlows.map((year) => (
                  <tr key={year.year} className="btr-table-row">
                    <td className="btr-table-cell">Year {year.year}</td>
                    <td className="btr-table-cell">{formatCurrency(year.noi || 0)}</td>
                    <td className="btr-table-cell">{formatCurrency(year.debtService || 0)}</td>
                    <td className="btr-table-cell">{year.dscr ? year.dscr.toFixed(2) : '0.00'}</td>
                    <td className="btr-table-cell">{formatCurrency(year.preferredReturnPaid || 0)}</td>
                    <td className="btr-table-cell">{formatCurrency(year.lpDistribution || 0)}</td>
                    <td className="btr-table-cell">{year.cashYield ? year.cashYield.toFixed(2) : '0.00'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Portfolio Value Chart */}
        <div className="btr-chart-container btr-card btr-full-width">
          <h3 className="btr-chart-title">Portfolio Value Projection</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={results.portfolioValueChartData} 
              margin={{ top: 10, right: 30, bottom: 20, left: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#555" : "#ccc"} />
              <XAxis 
                dataKey="year" 
                tick={{ fill: isDarkMode ? "#ffffff" : "#1f2937", fontWeight: "bold" }}
              />
              <YAxis 
                tick={{ fill: isDarkMode ? "#ffffff" : "#1f2937", fontWeight: "bold" }}
                tickFormatter={(value) => formatCurrency(value, true)} 
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#2f3c4a' : '#ffffff',
                  borderColor: isDarkMode ? '#5aB6BF' : '#d1d5db',
                  color: isDarkMode ? '#f9fafb' : '#1f2937',
                  fontWeight: "bold"
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke={chartColors.portfolioValue} strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="portfolioCost" name="Acquisition Cost" stroke={chartColors.portfolioCost} strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="portfolioDebt" name="Remaining Debt" stroke={chartColors.portfolioDebt} strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="lpEquity" name="LP Equity" stroke={chartColors.lpEquity} strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Annual Cash Flow Chart */}
        <div className="btr-chart-container btr-card btr-full-width">
          <h3 className="btr-chart-title">Annual Cash Flow Projection</h3>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart 
              data={cashFlowChartData} 
              margin={{ top: 10, right: 30, bottom: 20, left: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#555" : "#ccc"} />
              <XAxis 
                dataKey="year" 
                tick={{ fill: isDarkMode ? "#ffffff" : "#1f2937", fontWeight: "bold" }}
              />
              <YAxis 
                tick={{ fill: isDarkMode ? "#ffffff" : "#1f2937", fontWeight: "bold" }}
                tickFormatter={(value) => formatCurrency(value, true)} 
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)} 
                contentStyle={{ 
                  backgroundColor: isDarkMode ? '#2f3c4a' : '#ffffff',
                  borderColor: isDarkMode ? '#5aB6BF' : '#d1d5db',
                  color: isDarkMode ? '#f9fafb' : '#1f2937',
                  fontWeight: "bold"
                }}
              />
              <Legend wrapperStyle={{ paddingTop: "10px" }} />
              <Line type="monotone" dataKey="noi" name="NOI" stroke={chartColors.noi} strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="debtService" name="Debt Service" stroke={chartColors.debtService} strokeWidth={3} dot={{ r: 5 }} />
              <Line type="monotone" dataKey="lpDistribution" name="LP Distribution" stroke={chartColors.lpDistribution} strokeWidth={3} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Peak Equity Chart - Shows equity requirement over construction period */}
        <div className="btr-card btr-full-width">
          <h2 className="btr-section-title">Equity Requirement During Construction</h2>
          <div className="btr-chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={results.equityRequirementData}
                margin={{ top: 10, right: 30, left: 30, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#555" : "#ccc"} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: isDarkMode ? "#eee" : "#333" }}
                  fontSize={12}
                />
                <YAxis 
                  yAxisId="left"
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                  tick={{ fill: isDarkMode ? "#eee" : "#333" }}
                  fontSize={12}
                  orientation="left"
                />
                <YAxis 
                  yAxisId="right"
                  dataKey="homesCompleted"
                  orientation="right" 
                  tick={{ fill: isDarkMode ? "#eee" : "#333" }}
                  fontSize={12}
                />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === "equityDeployed" || name === "permanentDebt") {
                      return [`${formatCurrency(value)}`, name === "equityDeployed" ? "Equity Deployed" : "Permanent Debt"];
                    }
                    return [value, name === "homesCompleted" ? "Homes Completed" : name];
                  }}
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? "#2c3e50" : "#fff",
                    color: isDarkMode ? "#eee" : "#333",
                    border: `1px solid ${isDarkMode ? "#555" : "#ddd"}`,
                    borderRadius: "4px",
                    fontSize: "12px"
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  wrapperStyle={{ 
                    paddingTop: "10px",
                    fontSize: "12px"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="equityDeployed" 
                  yAxisId="left"
                  stroke={chartColors.equityDeployed}
                  fill={chartColors.equityDeployed}
                  fillOpacity={0.3}
                  name="Equity Deployed"
                />
                <Area 
                  type="monotone" 
                  dataKey="permanentDebt" 
                  yAxisId="left"
                  stroke={chartColors.portfolioDebt}
                  fill={chartColors.portfolioDebt}
                  fillOpacity={0.3}
                  name="Permanent Debt"
                />
                <Line 
                  type="monotone" 
                  dataKey="homesCompleted" 
                  yAxisId="right"
                  stroke={chartColors.homesCompleted}
                  strokeWidth={3}
                  name="Homes Completed"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Results Dashboard */}
        <div className="btr-card btr-full-width">
          <h2 className="btr-section-title">Investment Returns Dashboard</h2>
          <div className="btr-metrics-grid">
            <div className="btr-metric btr-metric-blue">
              <h3 className="btr-metric-title">IRR</h3>
              <p className="btr-metric-value">
                {results.returns.irr ? formatPercent(results.returns.irr) : '-'}
              </p>
            </div>
            <div className="btr-metric btr-metric-green">
              <h3 className="btr-metric-title">Equity Multiple</h3>
              <p className="btr-metric-value">
                {results.returns.equityMultiple ? results.returns.equityMultiple.toFixed(2) + 'x' : '-'}
              </p>
            </div>
            <div className="btr-metric btr-metric-purple">
              <h3 className="btr-metric-title">Cash Yield</h3>
              <p className="btr-metric-value">
                {results.returns.averageAnnualCashYield ? formatPercent(results.returns.averageAnnualCashYield / 100) : '-'}
              </p>
            </div>
            <div className="btr-metric btr-metric-orange">
              <h3 className="btr-metric-title">Peak Equity</h3>
              <p className="btr-metric-value">
                {results.returns.peakEquity ? formatCurrency(results.returns.peakEquity) : '-'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Development Cost Summary */}
        <div className="btr-card btr-full-width">
          <h2 className="btr-section-title">Development Cost Summary</h2>
          <div className="btr-cost-summary">
            <div className="btr-cost-row">
              <div className="btr-cost-label">Land Acquisition</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.landCost || 0)}</div>
            </div>
            <div className="btr-cost-row">
              <div className="btr-cost-label">Land Development</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.landDevelopmentCost || 0)}</div>
            </div>
            <div className="btr-cost-row">
              <div className="btr-cost-label">Construction Cost</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.constructionCost || 0)}</div>
            </div>
            <div className="btr-cost-row">
              <div className="btr-cost-label">Development Fee</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.developmentFee || 0)}</div>
            </div>
            <div className="btr-cost-row btr-cost-total">
              <div className="btr-cost-label">Total Development Cost</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.totalAcquisitionCost || 0)}</div>
            </div>
            <div className="btr-cost-row">
              <div className="btr-cost-label">Permanent Financing</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.loanAmount || 0)}</div>
            </div>
            <div className="btr-cost-row btr-cost-total">
              <div className="btr-cost-label">Required Equity</div>
              <div className="btr-cost-value">{formatCurrency(results.acquisitionSummary.equityRequired || 0)}</div>
            </div>
          </div>
        </div>
          <div className="btr-input-group">
            <label className="btr-label">3-Bed Homes</label>
            <input
              type="number"
              name="phase1Bed3"
              value={inputs.phase1Bed3}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">4-Bed Homes</label>
            <input
              type="number"
              name="phase1Bed4"
              value={inputs.phase1Bed4}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Preferred Return</label>
            <select
              name="preferredReturn"
              value={inputs.preferredReturn}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.06}>6%</option>
              <option value={0.07}>7%</option>
              <option value={0.08}>8%</option>
              <option value={0.09}>9%</option>
            </select>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">LP/GP Profit Share Split</label>
            <select
              value={inputs.lpSplit}
              onChange={handleSplitChange}
              className="btr-input"
            >
              <option value={1.00}>100% / 0%</option>
              <option value={0.95}>95% / 5%</option>
              <option value={0.90}>90% / 10%</option>
              <option value={0.85}>85% / 15%</option>
              <option value={0.80}>80% / 20%</option>
              <option value={0.75}>75% / 25%</option>
              <option value={0.70}>70% / 30%</option>
              <option value={0.65}>65% / 35%</option>
              <option value={0.60}>60% / 40%</option>
              <option value={0.55}>55% / 45%</option>
              <option value={0.50}>50% / 50%</option>
            </select>
            <p className="btr-note">LP / GP (after preferred return)</p>
          </div>
        </div>
        
        <div className="btr-card">
          <h2 className="btr-section-title">Property Details</h2>
          <div className="btr-input-group">
            <label className="btr-label">3-Bed Acquisition Price</label>
            <input
              type="number"
              name="acquisitionPrice3Bed"
              value={inputs.acquisitionPrice3Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">3-Bed Market Value</label>
            <input
              type="number"
              name="marketValue3Bed"
              value={inputs.marketValue3Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">3-Bed Monthly Rent</label>
            <input
              type="number"
              name="monthlyRent3Bed"
              value={inputs.monthlyRent3Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">4-Bed Acquisition Price</label>
            <input
              type="number"
              name="acquisitionPrice4Bed"
              value={inputs.acquisitionPrice4Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">4-Bed Market Value</label>
            <input
              type="number"
              name="marketValue4Bed"
              value={inputs.marketValue4Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
          <div className="btr-input-group">
            <label className="btr-label">4-Bed Monthly Rent</label>
            <input
              type="number"
              name="monthlyRent4Bed"
              value={inputs.monthlyRent4Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
          </div>
        </div>
        
        {/* ROW 2: Construction Timeline and Costs */}
        <div className="btr-card">
          <h2 className="btr-section-title">Construction Timeline</h2>
          <div className="btr-input-group">
            <label className="btr-label">Construction Period (Months)</label>
            <input
              type="number"
              name="constructionPeriodMonths"
              value={inputs.constructionPeriodMonths}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Total site development period</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Absorption Rate (Homes/Month)</label>
            <input
              type="number"
              name="absorptionRatePerMonth"
              value={inputs.absorptionRatePerMonth}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Homes delivered per month</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Lease-Up Period (Months)</label>
            <input
              type="number"
              name="leaseupPeriodMonths"
              value={inputs.leaseupPeriodMonths}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Average time to lease after completion</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Annual Rent Growth</label>
            <select
              name="annualRentGrowth"
              value={inputs.annualRentGrowth}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.02}>2%</option>
              <option value={0.03}>3%</option>
              <option value={0.04}>4%</option>
            </select>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Home Price Appreciation</label>
            <select
              name="homePriceAppreciation"
              value={inputs.homePriceAppreciation}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.02}>2%</option>
              <option value={0.03}>3%</option>
              <option value={0.04}>4%</option>
            </select>
          </div>
        </div>
        
        <div className="btr-card">
          <h2 className="btr-section-title">Construction Costs</h2>
          <div className="btr-input-group">
            <label className="btr-label">Land Cost per Home</label>
            <input
              type="number"
              name="landCostPerHome"
              value={inputs.landCostPerHome}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Raw land cost per home</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Land Development Cost per Home</label>
            <input
              type="number"
              name="landDevelopmentCostPerHome"
              value={inputs.landDevelopmentCostPerHome}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Site preparation, utilities, etc.</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">3-Bed Construction Cost</label>
            <input
              type="number"
              name="constructionCost3Bed"
              value={inputs.constructionCost3Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Factory-built cost</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">4-Bed Construction Cost</label>
            <input
              type="number"
              name="constructionCost4Bed"
              value={inputs.constructionCost4Bed}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Factory-built cost</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Development Fee</label>
            <select
              name="developmentFee"
              value={inputs.developmentFee}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.03}>3%</option>
              <option value={0.04}>4%</option>
              <option value={0.05}>5%</option>
              <option value={0.06}>6%</option>
            </select>
            <p className="btr-note">% of total development cost</p>
          </div>
        </div>
        
        {/* ROW 3: Operating Expenses and Financing */}
        <div className="btr-card">
          <h2 className="btr-section-title">Operating Expenses</h2>
          <div className="btr-input-group">
            <label className="btr-label">Property Management Fee</label>
            <select
              name="propertyManagementFee"
              value={inputs.propertyManagementFee}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.05}>5%</option>
              <option value={0.06}>6%</option>
              <option value={0.07}>7%</option>
              <option value={0.08}>8%</option>
              <option value={0.09}>9%</option>
              <option value={0.10}>10%</option>
            </select>
            <p className="btr-note">% of rental income</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Maintenance Cost</label>
            <select
              name="maintenanceCost"
              value={inputs.maintenanceCost}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.03}>3%</option>
              <option value={0.04}>4%</option>
              <option value={0.05}>5%</option>
              <option value={0.06}>6%</option>
              <option value={0.07}>7%</option>
            </select>
            <p className="btr-note">% of rental income</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Property Tax Rate</label>
            <select
              name="propertyTaxRate"
              value={inputs.propertyTaxRate}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.005}>0.5%</option>
              <option value={0.0075}>0.75%</option>
              <option value={0.01}>1.0%</option>
              <option value={0.0125}>1.25%</option>
              <option value={0.015}>1.5%</option>
              <option value={0.0175}>1.75%</option>
              <option value={0.02}>2.0%</option>
            </select>
            <p className="btr-note">% of property value</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Insurance Cost per Home</label>
            <input
              type="number"
              name="insuranceCostPerHome"
              value={inputs.insuranceCostPerHome}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Annual cost per home</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Vacancy Rate</label>
            <select
              name="vacancyRate"
              value={inputs.vacancyRate}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.03}>3%</option>
              <option value={0.04}>4%</option>
              <option value={0.05}>5%</option>
              <option value={0.06}>6%</option>
              <option value={0.07}>7%</option>
            </select>
            <p className="btr-note">% of potential rental income</p>
          </div>
        </div>
        
        <div className="btr-card">
          <h2 className="btr-section-title">Financing</h2>
          <div className="btr-input-group">
            <label className="btr-label">Permanent Loan to Value (LTV)</label>
            <select
              name="permanentLoanToValue"
              value={inputs.permanentLoanToValue}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.6}>60%</option>
              <option value={0.65}>65%</option>
              <option value={0.7}>70%</option>
              <option value={0.75}>75%</option>
              <option value={0.8}>80%</option>
            </select>
            <p className="btr-note">For completed homes</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Permanent Financing Rate</label>
            <select
              name="interestRate"
              value={inputs.interestRate}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.05}>5.000%</option>
              <option value={0.05125}>5.125%</option>
              <option value={0.0525}>5.250%</option>
              <option value={0.05375}>5.375%</option>
              <option value={0.055}>5.500%</option>
              <option value={0.05625}>5.625%</option>
              <option value={0.0575}>5.750%</option>
              <option value={0.05875}>5.875%</option>
              <option value={0.06}>6.000%</option>
            </select>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Hold Period (Years)</label>
            <select
              name="holdPeriodYears"
              value={inputs.holdPeriodYears}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={5}>5 Years</option>
              <option value={7}>7 Years</option>
              <option value={10}>10 Years</option>
            </select>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Exit Strategy</label>
            <select
              name="exitStrategy"
              value={inputs.exitStrategy}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value="portfolio">Portfolio Sale</option>
              <option value="individual">Individual Home Sales</option>
            </select>
          </div>
          {inputs.exitStrategy === "portfolio" && (
            <div className="btr-input-group">
              <label className="btr-label">Exit Cap Rate</label>
              <select
                name="portfolioExitCapRate"
                value={inputs.portfolioExitCapRate}
                onChange={handleInputChange}
                className="btr-input"
              >
                <option value={0.045}>4.50%</option>
                <option value={0.0475}>4.75%</option>
                <option value={0.05}>5.00%</option>
                <option value={0.0525}>5.25%</option>
                <option value={0.055}>5.50%</option>
                <option value={0.0575}>5.75%</option>
                <option value={0.06}>6.00%</option>
              </select>
              <p className="btr-note">Lower cap rate = higher sale value</p>
            </div>
          )}
        </div>