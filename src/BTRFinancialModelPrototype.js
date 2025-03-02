import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Add explicit styling for deployment environments
import './BTRFinancialModel.css'; // Make sure this points to the updated CSS file
import ReportButton from './ReportButton';

const BTRFinancialModelPrototype = () => {
  // Add theme state
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode to match investor presentation
  
  // Find your existing useState declaration for inputs and replace it with this:
  const [inputs, setInputs] = useState({
    // Fund Structure
    phase1Homes: 500,
    phase1Bed3: 250,
    phase1Bed4: 250,
    preferredReturn: 0.08,
    lpSplit: 0.80,
    gpSplit: 0.20,
    
    // Financing
    loanToValue: 0.60,
    interestRate: 0.055,
    interestOnly: true,
    interestOnlyPeriod: 10,
    
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
    
    // New Operating Expense inputs
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
    exitSummary: {},
    returns: {},
    portfolioValueChartData: []
  });
  
  // Toggle between dark and light mode
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };
  
  // IRR calculation function
  const calculateIRR = (cashFlows) => {
    // NPV function - calculates Net Present Value at a given rate
    const npv = (rate, cashFlows) => {
      return cashFlows.reduce((acc, cf, index) => {
        return acc + cf / Math.pow(1 + rate, index);
      }, 0);
    };
    
    // Return 0 if there's no investment (negative cash flow)
    if (cashFlows[0] >= 0) {
      return 0;
    }
    
    // Check if we have any positive cash flows
    const hasPositive = cashFlows.slice(1).some(cf => cf > 0);
    if (!hasPositive) {
      return -1; // No positive returns, investment loses money
    }
    
    // Binary search method to find IRR
    let low = -0.999; // -99.9%
    let high = 2.0;   // 200%
    let mid;
    let result;
    
    // Start with a reasonable guess based on overall return
    const totalReturn = cashFlows.reduce((sum, cf) => sum + cf, 0);
    const years = cashFlows.length - 1;
    const roughGuess = Math.pow(Math.abs(totalReturn / cashFlows[0]), 1/years) - 1;
    
    // If rough guess is sensible, use it as a starting point
    if (roughGuess > low && roughGuess < high) {
      mid = roughGuess;
    } else {
      mid = 0.1; // 10% as default starting point
    }
    
    const maxIterations = 50;
    const precision = 0.0001; // 0.01% precision
    
    // Iterative approach to narrow down the IRR
    for (let i = 0; i < maxIterations; i++) {
      result = npv(mid, cashFlows);
      
      // If we're close enough to zero, we found the IRR
      if (Math.abs(result) < precision) {
        return mid;
      }
      
      if (result > 0) {
        low = mid;
      } else {
        high = mid;
      }
      
      mid = (low + high) / 2;
    }
    
    return mid; // Return our best approximation
  };
  
  // Calculate remaining loan balance function
  const calculateRemainingLoanBalance = (principal, rate, termYears, elapsedYears) => {
    const monthlyRate = rate / 12;
    const totalPayments = termYears * 12;
    const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalPayments));
    
    let balance = principal;
    for (let i = 0; i < elapsedYears * 12; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
    }
    
    return Math.max(0, balance);
  };
  
  // Calculate results whenever inputs change
  useEffect(() => {
    // Main calculation function
    const calculateResults = () => {
      // 1. ACQUISITION CALCULATIONS
      const phase1Acquisition3Bed = inputs.phase1Bed3 * inputs.acquisitionPrice3Bed;
      const phase1Acquisition4Bed = inputs.phase1Bed4 * inputs.acquisitionPrice4Bed;
      const phase1TotalAcquisition = phase1Acquisition3Bed + phase1Acquisition4Bed;
      
      // Calculate loan amount
      const loanAmount = phase1TotalAcquisition * inputs.loanToValue;
      const equityRequired = phase1TotalAcquisition - loanAmount;
      
      // Calculate interest-only payment
      const annualInterestOnlyPayment = loanAmount * inputs.interestRate;
      
      // Store acquisition summary
      const acquisitionSummary = {
        totalHomes: inputs.phase1Homes,
        totalAcquisitionCost: phase1TotalAcquisition,
        loanAmount,
        equityRequired,
        loanToValue: inputs.loanToValue,
        annualInterestOnlyPayment
      };
      
      // 2. CASH FLOW PROJECTIONS
      let accumulatedPreferredReturn = 0;
      let unpaidPreferredReturn = 0;
      let cashFlows = [];
      
      // Calculate total property value
      const initialPropertyValue3Bed = inputs.marketValue3Bed * inputs.phase1Bed3;
      const initialPropertyValue4Bed = inputs.marketValue4Bed * inputs.phase1Bed4;
      const totalPropertyValue = initialPropertyValue3Bed + initialPropertyValue4Bed;
      
      // Generate annual cash flows
      for (let year = 1; year <= inputs.holdPeriodYears; year++) {
        // Calculate rental income with growth
        const rentGrowthFactor = Math.pow(1 + inputs.annualRentGrowth, year - 1);
        const annualRent3Bed = inputs.phase1Bed3 * inputs.monthlyRent3Bed * 12 * rentGrowthFactor;
        const annualRent4Bed = inputs.phase1Bed4 * inputs.monthlyRent4Bed * 12 * rentGrowthFactor;
        const potentialRentalIncome = annualRent3Bed + annualRent4Bed;
        const effectiveRentalIncome = potentialRentalIncome * (1 - inputs.vacancyRate);
        
        // Calculate property values for this year
        const propertyValue3Bed = inputs.marketValue3Bed * Math.pow(1 + inputs.homePriceAppreciation, year - 1);
        const propertyValue4Bed = inputs.marketValue4Bed * Math.pow(1 + inputs.homePriceAppreciation, year - 1);
        const totalPropertyValueThisYear = (propertyValue3Bed * inputs.phase1Bed3) + 
                                 (propertyValue4Bed * inputs.phase1Bed4);
        
       // Find this part in your calculateResults function:
       // const totalOperatingExpenses = effectiveRentalIncome * 0.3;

       // Replace it with this code:
        const calculateOperatingExpenses = (rentalIncome, propertyValue) => {
          const propertyManagement = rentalIncome * inputs.propertyManagementFee;
          const maintenance = rentalIncome * inputs.maintenanceCost;
          const propertyTaxes = propertyValue * inputs.propertyTaxRate;
          const insurance = inputs.phase1Homes * inputs.insuranceCostPerHome;
          const hoaFees = inputs.phase1Homes * inputs.hoaFeesPerHome;
          const otherExpenses = inputs.phase1Homes * inputs.otherExpensesPerHome;
          
          return propertyManagement + maintenance + propertyTaxes + insurance + hoaFees + otherExpenses;
        };

        const totalPropertyValue = (propertyValue3Bed * inputs.phase1Bed3) + (propertyValue4Bed * inputs.phase1Bed4);
        const totalOperatingExpenses = calculateOperatingExpenses(effectiveRentalIncome, totalPropertyValue);
        
        // Calculate NOI
        const noi = effectiveRentalIncome - totalOperatingExpenses;
        
        // Use interest-only debt service
        const annualDebtService = annualInterestOnlyPayment;
        
        // Calculate cash flow after debt service
        const cashFlowAfterDebtService = noi - annualDebtService;
        
        // Calculate preferred return for the year
        const annualPreferredReturn = equityRequired * inputs.preferredReturn;
        
        // Track if preferred return is fully paid
        let preferredReturnPaid = 0;
        if (cashFlowAfterDebtService >= annualPreferredReturn + unpaidPreferredReturn) {
          preferredReturnPaid = annualPreferredReturn + unpaidPreferredReturn;
          unpaidPreferredReturn = 0;
        } else {
          preferredReturnPaid = cashFlowAfterDebtService;
          unpaidPreferredReturn += (annualPreferredReturn - preferredReturnPaid);
        }
        
        accumulatedPreferredReturn += preferredReturnPaid;
        
        // Remaining cash flow after preferred return
        const remainingCashFlow = Math.max(0, cashFlowAfterDebtService - preferredReturnPaid);
        
        // Split remaining cash flow
        const lpDistribution = preferredReturnPaid + (remainingCashFlow * inputs.lpSplit);
        const gpDistribution = remainingCashFlow * inputs.gpSplit;
        
        // Store annual results
        cashFlows.push({
          year,
          rentalIncome: effectiveRentalIncome,
          operatingExpenses: totalOperatingExpenses,
          noi,
          debtService: annualDebtService,
          cashFlowAfterDebtService,
          preferredReturnPaid,
          unpaidPreferredReturn,
          lpDistribution,
          gpDistribution,
          dscr: noi / annualDebtService,
          cashYield: (lpDistribution / equityRequired) * 100,
          grossIncome: effectiveRentalIncome, // For ReportButton
          cashFlow: cashFlowAfterDebtService // For ReportButton
        });
      }
      
      // 3. PORTFOLIO VALUE CHART DATA
      const portfolioValueChartData = [];
      
      // Add initial year (acquisition)
      const initialPortfolioValue = inputs.phase1Bed3 * inputs.marketValue3Bed + inputs.phase1Bed4 * inputs.marketValue4Bed;
      
      portfolioValueChartData.push({
        year: 'Year 0',
        portfolioValue: initialPortfolioValue,
        portfolioCost: phase1TotalAcquisition,
        portfolioDebt: loanAmount,
        lpEquity: initialPortfolioValue - loanAmount,
        value: initialPortfolioValue // For ReportButton
      });
      
      // Add data for each year of the hold period
      for (let year = 1; year <= inputs.holdPeriodYears; year++) {
        const propertyValue3Bed = inputs.marketValue3Bed * Math.pow(1 + inputs.homePriceAppreciation, year);
        const propertyValue4Bed = inputs.marketValue4Bed * Math.pow(1 + inputs.homePriceAppreciation, year);
        const totalPropertyValueThisYear = (propertyValue3Bed * inputs.phase1Bed3) + (propertyValue4Bed * inputs.phase1Bed4);
        
        // For simplicity, assume no loan amortization in this prototype
        const remainingLoanBalance = loanAmount;
        
        portfolioValueChartData.push({
          year: `Year ${year}`,
          portfolioValue: totalPropertyValueThisYear,
          portfolioCost: phase1TotalAcquisition,
          portfolioDebt: remainingLoanBalance,
          lpEquity: totalPropertyValueThisYear - remainingLoanBalance,
          value: totalPropertyValueThisYear // For ReportButton
        });
      }
      
      // 4. EXIT CALCULATIONS
      // Calculate exit value based on exit strategy
      
      let grossSaleProceeds;
      let sellingCosts;
      
      if (inputs.exitStrategy === "portfolio") {
        // Portfolio sale based on cap rate
        const lastYearNOI = cashFlows[cashFlows.length - 1].noi;
        grossSaleProceeds = lastYearNOI / inputs.portfolioExitCapRate;
      } else {
        // Individual home sales
        const exitPropertyValue3Bed = inputs.marketValue3Bed * 
          Math.pow(1 + inputs.homePriceAppreciation, inputs.holdPeriodYears);
        const exitPropertyValue4Bed = inputs.marketValue4Bed * 
          Math.pow(1 + inputs.homePriceAppreciation, inputs.holdPeriodYears);
        const totalExitValue = (exitPropertyValue3Bed * inputs.phase1Bed3) + 
                               (exitPropertyValue4Bed * inputs.phase1Bed4);
        
        // Apply individual sales premium
        grossSaleProceeds = totalExitValue * (1 + inputs.individualSalesPremium);
      }
      
      // Apply brokerage fee
      sellingCosts = grossSaleProceeds * inputs.brokerageFee;
      const netSaleProceeds = grossSaleProceeds - sellingCosts;
      
      // Remaining loan balance at exit
      const remainingLoanBalance = loanAmount;
      
      // Net proceeds after debt repayment
      const netProceedsAfterDebt = netSaleProceeds - remainingLoanBalance;
      
      // Waterfall distribution at exit
      const returnOfCapital = equityRequired;
      const preferredReturnAtExit = accumulatedPreferredReturn + unpaidPreferredReturn;
      
      const remainingProceeds = netProceedsAfterDebt - returnOfCapital - unpaidPreferredReturn;
      const lpProfit = remainingProceeds > 0 ? remainingProceeds * inputs.lpSplit : 0;
      const gpProfit = remainingProceeds > 0 ? remainingProceeds * inputs.gpSplit : 0;
      
      const totalToLPs = returnOfCapital + preferredReturnAtExit + lpProfit;
      
      // Set up cash flows for IRR calculation
      const irrCashFlows = [-equityRequired];
      cashFlows.forEach(year => {
        irrCashFlows.push(year.lpDistribution);
      });
      
      // Add exit distribution to IRR calculation
      irrCashFlows[irrCashFlows.length - 1] += (totalToLPs - accumulatedPreferredReturn);
      
      // Calculate IRR using our function
      const estimatedIRR = calculateIRR(irrCashFlows);
      
      // Calculate equity multiple
      const equityMultiple = totalToLPs / equityRequired;
      
      // Average annual cash yield
      const averageCashYield = cashFlows.reduce((sum, year) => sum + year.cashYield, 0) / inputs.holdPeriodYears;
      
      const exitSummary = {
        grossSaleProceeds,
        sellingCosts,
        netSaleProceeds,
        remainingLoanBalance,
        netProceedsAfterDebt,
        returnOfCapital,
        preferredReturnAtExit,
        lpProfit,
        gpProfit,
        totalToLPs
      };
      
      const returns = {
        irr: estimatedIRR,
        equityMultiple,
        totalCashToLPs: totalToLPs,
        averageAnnualCashYield: averageCashYield
      };
      
      // Set all results
      setResults({
        acquisitionSummary,
        cashFlows,
        exitSummary,
        returns,
        portfolioValueChartData
      });
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
    noi: year.noi,
    debtService: year.debtService,
    lpDistribution: year.lpDistribution
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
      lpDistribution: "#7BE495"  // Soft green for LP distribution
    };
  };
  
  const chartColors = getChartColors();
  
  // Prepare data for the ReportButton component
// Find where you define the modelData object and update it to include the new properties:
const modelData = {
  fundStructure: "USDV BTR Opportunity Fund",
  totalHomes: inputs.phase1Homes,
  threeBedHomes: inputs.phase1Bed3,
  fourBedHomes: inputs.phase1Bed4,
  investmentYears: inputs.holdPeriodYears,
  landCostPerHome: inputs.acquisitionPrice3Bed * 0.2, // Estimate land cost as 20% of acquisition price
  constructionCostPerHome: inputs.acquisitionPrice3Bed * 0.8, // Estimate construction cost as 80% of acquisition price
  otherCostsPerHome: 5000, // Placeholder value
  threeBedRent: inputs.monthlyRent3Bed,
  fourBedRent: inputs.monthlyRent4Bed,
  occupancyRate: 1 - inputs.vacancyRate,
  ltc: inputs.loanToValue,
  interestRate: inputs.interestRate,
  loanTerm: 30, // Placeholder value
  
  // Add these new properties
  propertyManagementFee: inputs.propertyManagementFee,
  maintenanceCosts: inputs.maintenanceCost,
  propertyTaxRate: inputs.propertyTaxRate,
  insuranceCostPerHome: inputs.insuranceCostPerHome,
  hoaFeesPerHome: inputs.hoaFeesPerHome,
  otherExpensesPerHome: inputs.otherExpensesPerHome,
  exitStrategy: inputs.exitStrategy // Important for conditional report rendering
};
  
const calculatedResults = {
  totalInvestment: results.acquisitionSummary.equityRequired || 0,
  irr: results.returns.irr || 0,
  cashOnCashReturn: (results.returns.averageAnnualCashYield || 0) / 100,
  capRate: results.cashFlows && results.cashFlows.length > 0 ? 
           results.cashFlows[0].noi / results.portfolioValueChartData[0].portfolioValue : 0,
  equityMultiple: results.returns.equityMultiple || 0,
  paybackPeriod: 5, // Placeholder value
  totalAcquisitionCosts: results.acquisitionSummary.totalAcquisitionCost || 0,
  totalFinancingCosts: 0, // Placeholder value
  totalProjectCost: results.acquisitionSummary.totalAcquisitionCost || 0,
  loanAmount: results.acquisitionSummary.loanAmount || 0,
  equityAmount: results.acquisitionSummary.equityRequired || 0,
  annualDebtService: results.acquisitionSummary.annualInterestOnlyPayment || 0,
  threeBedAnnualIncome: inputs.phase1Bed3 * inputs.monthlyRent3Bed * 12 * (1 - inputs.vacancyRate),
  fourBedAnnualIncome: inputs.phase1Bed4 * inputs.monthlyRent4Bed * 12 * (1 - inputs.vacancyRate),
  totalAnnualIncome: results.cashFlows && results.cashFlows.length > 0 ? 
                    results.cashFlows[0].rentalIncome : 0,
  
  // Replace these estimated values with directly calculated ones
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
                           results.cashFlows[0].dscr : 0
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
    year: item.year.replace('Year ', ''),
    value: item.portfolioValue
  }));
  
  // Convert cash flows to the format needed for ReportButton
  const cashFlows = results.cashFlows.map(yearData => ({
    year: yearData.year,
    grossIncome: yearData.rentalIncome,
    operatingExpenses: yearData.operatingExpenses,
    netOperatingIncome: yearData.noi,
    debtService: yearData.debtService,
    cashFlow: yearData.cashFlowAfterDebtService,
    cashFlowYield: yearData.cashYield / 100
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
      />
      
      {/* Updated grid layout with 2 cards per row */}
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
        
        {/* ROW 2: Operating Expenses and Financing */}
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
            <label className="btr-label">HOA Fees per Home</label>
            <input
              type="number"
              name="hoaFeesPerHome"
              value={inputs.hoaFeesPerHome}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Annual HOA fees per home</p>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Other Expenses per Home</label>
            <input
              type="number"
              name="otherExpensesPerHome"
              value={inputs.otherExpensesPerHome}
              onChange={handleInputChange}
              className="btr-input"
            />
            <p className="btr-note">Annual other expenses per home</p>
          </div>
        </div>
        
        <div className="btr-card">
          <h2 className="btr-section-title">Financing</h2>
          <div className="btr-input-group">
            <label className="btr-label">Loan to Value (LTV)</label>
            <select
              name="loanToValue"
              value={inputs.loanToValue}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
            </select>
          </div>
          <div className="btr-input-group">
            <label className="btr-label">Interest Rate</label>
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
              <option value={0.06125}>6.125%</option>
              <option value={0.0625}>6.250%</option>
              <option value={0.06375}>6.375%</option>
              <option value={0.065}>6.500%</option>
              <option value={0.06625}>6.625%</option>
              <option value={0.0675}>6.750%</option>
              <option value={0.06875}>6.875%</option>
              <option value={0.07}>7.000%</option>
              <option value={0.07125}>7.125%</option>
              <option value={0.0725}>7.250%</option>
              <option value={0.07375}>7.375%</option>
              <option value={0.075}>7.500%</option>
              <option value={0.07625}>7.625%</option>
              <option value={0.0775}>7.750%</option>
              <option value={0.07875}>7.875%</option>
              <option value={0.08}>8.000%</option>
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
                <option value={0.0625}>6.25%</option>
                <option value={0.065}>6.50%</option>
              </select>
              <p className="btr-note">Lower cap rate = higher sale value</p>
            </div>
          )}
          {inputs.exitStrategy === "individual" && (
            <div className="btr-input-group">
              <label className="btr-label">Individual Sale Premium</label>
              <select
                name="individualSalesPremium"
                value={inputs.individualSalesPremium}
                onChange={handleInputChange}
                className="btr-input"
              >
                <option value={0.00}>0%</option>
                <option value={0.025}>2.5%</option>
                <option value={0.05}>5%</option>
                <option value={0.075}>7.5%</option>
                <option value={0.10}>10%</option>
              </select>
              <p className="btr-note">Premium over portfolio market value</p>
            </div>
          )}
          <div className="btr-input-group">
            <label className="btr-label">Brokerage Fee</label>
            <select
              name="brokerageFee"
              value={inputs.brokerageFee}
              onChange={handleInputChange}
              className="btr-input"
            >
              <option value={0.00}>0.0%</option>
              <option value={0.005}>0.5%</option>
              <option value={0.01}>1.0%</option>
              <option value={0.015}>1.5%</option>
              <option value={0.02}>2.0%</option>
              <option value={0.025}>2.5%</option>
              <option value={0.03}>3.0%</option>
              <option value={0.035}>3.5%</option>
              <option value={0.04}>4.0%</option>
              <option value={0.045}>4.5%</option>
              <option value={0.05}>5.0%</option>
              <option value={0.055}>5.5%</option>
              <option value={0.06}>6.0%</option>
            </select>
          </div>
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
            <h3 className="btr-metric-title">Total Investment</h3>
            <p className="btr-metric-value">
              {results.acquisitionSummary.equityRequired ? formatCurrency(results.acquisitionSummary.equityRequired) : '-'}
            </p>
          </div>
        </div>
        
        {/* LP/GP split visualization */}
        <div className="btr-profit-split-display">
          <h3 className="btr-profit-split-title">Profit Share Structure</h3>
          <div className="btr-profit-split-bars">
            <div className="btr-profit-split-bar">
              <div 
                className="btr-segment-lp" 
                style={{width: `${inputs.lpSplit * 100}%`}}
              >
                LP: {(inputs.lpSplit * 100).toFixed(0)}%
              </div>
              <div 
                className="btr-segment-gp" 
                style={{width: `${inputs.gpSplit * 100}%`}}
              >
                GP: {(inputs.gpSplit * 100).toFixed(0)}%
              </div>
            </div>
          </div>
          <p className="btr-note">Distribution after {(inputs.preferredReturn * 100).toFixed(0)}% preferred return</p>
        </div>
      </div>
      
{/* Portfolio Value Chart - With Title and Custom Legend */}
<div className="btr-chart-container">
  {/* Add a chart title */}
  <h3 style={{
    textAlign: 'center',
    color: isDarkMode ? '#ffffff' : '#1f2937',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  }}>Portfolio Value Projection</h3>
  
  <ResponsiveContainer width="100%" height={270}> {/* Reduced height to make room for title */}
    <LineChart 
      data={results.portfolioValueChartData} 
      margin={{ top: 10, right: 30, bottom: 5, left: 30 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
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
      <Line type="monotone" dataKey="portfolioValue" name="Portfolio Value" stroke={chartColors.portfolioValue} strokeWidth={3} dot={{ r: 5 }} />
      <Line type="monotone" dataKey="portfolioCost" name="Acquisition Cost" stroke={chartColors.portfolioCost} strokeWidth={3} dot={{ r: 5 }} />
      <Line type="monotone" dataKey="portfolioDebt" name="Remaining Debt" stroke={chartColors.portfolioDebt} strokeWidth={3} dot={{ r: 5 }} />
      <Line type="monotone" dataKey="lpEquity" name="LP Equity" stroke={chartColors.lpEquity} strokeWidth={3} dot={{ r: 5 }} />
    </LineChart>
  </ResponsiveContainer>
  
  {/* Custom legend outside the chart */}
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    padding: '8px',
    marginTop: '5px',
    background: isDarkMode ? '#1a2636' : '#ffffff',
    border: `2px solid ${chartColors.portfolioValue}`,
    borderRadius: '4px'
  }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.portfolioValue, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>Portfolio Value</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.portfolioCost, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>Acquisition Cost</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.portfolioDebt, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>Remaining Debt</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.lpEquity, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>LP Equity</span>
      </div>
    </div>
  </div>
</div>

{/* Annual Cash Flow Chart - With Title and Custom Legend */}
<div className="btr-chart-container">
  {/* Add a chart title */}
  <h3 style={{
    textAlign: 'center',
    color: isDarkMode ? '#ffffff' : '#1f2937',
    margin: '0 0 10px 0',
    fontWeight: 'bold',
    fontSize: '1.2rem'
  }}>Annual Cash Flow Projection</h3>
  
  <ResponsiveContainer width="100%" height={270}> {/* Reduced height to make room for title */}
    <LineChart 
      data={cashFlowChartData} 
      margin={{ top: 10, right: 30, bottom: 5, left: 30 }}
    >
      <CartesianGrid strokeDasharray="3 3" />
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
      <Line type="monotone" dataKey="noi" name="NOI" stroke={chartColors.noi} strokeWidth={3} dot={{ r: 5 }} />
      <Line type="monotone" dataKey="debtService" name="Debt Service" stroke={chartColors.debtService} strokeWidth={3} dot={{ r: 5 }} />
      <Line type="monotone" dataKey="lpDistribution" name="Investor Distribution" stroke={chartColors.lpDistribution} strokeWidth={3} dot={{ r: 5 }} />
    </LineChart>
  </ResponsiveContainer>
  
  {/* Custom legend outside the chart */}
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    padding: '8px',
    marginTop: '5px',
    background: isDarkMode ? '#1a2636' : '#ffffff',
    border: `2px solid ${chartColors.noi}`,
    borderRadius: '4px'
  }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.noi, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>NOI</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.debtService, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>Debt Service</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div style={{ width: '15px', height: '15px', backgroundColor: chartColors.lpDistribution, marginRight: '5px' }}></div>
        <span style={{ color: isDarkMode ? '#ffffff' : '#1f2937', fontWeight: 'bold' }}>Investor Distribution</span>
      </div>
    </div>
  </div>
</div>
      
      {/* Cash Flow Details */}
      <div className="btr-card btr-full-width">
        <h2 className="btr-section-title">Annual Cash Flow Details</h2>
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
                <th className="btr-table-cell">GP Distribution</th>
                <th className="btr-table-cell">Cash Yield</th>
              </tr>
            </thead>
            <tbody>
              {results.cashFlows.map((year) => (
                <tr key={year.year} className="btr-table-row">
                  <td className="btr-table-cell">Year {year.year}</td>
                  <td className="btr-table-cell">{formatCurrency(year.noi)}</td>
                  <td className="btr-table-cell">{formatCurrency(year.debtService)}</td>
                  <td className="btr-table-cell">{year.dscr.toFixed(2)}</td>
                  <td className="btr-table-cell">{formatCurrency(year.preferredReturnPaid)}</td>
                  <td className="btr-table-cell">{formatCurrency(year.lpDistribution)}</td>
                  <td className="btr-table-cell">{formatCurrency(year.gpDistribution)}</td>
                  <td className="btr-table-cell">{year.cashYield.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <p className="btr-note">A Wealth-Building Strategy You Can't Afford to Miss: 2,000 BTR Homes, 2 Phases, First-Mover Advantage.</p>
      </div>
    </div>
  );
};

export default BTRFinancialModelPrototype;