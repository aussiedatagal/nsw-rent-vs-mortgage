export function calculateMortgage(loanAmount, annualRate, termYears, type) {
  if (loanAmount <= 0) {
    return { payment: 0, interest: 0 };
  }
  const numPayments = termYears * 12;
  if (annualRate === 0) {
    return { payment: loanAmount / numPayments, interest: 0 };
  }

  const monthlyRate = (annualRate / 100) / 12;
  const monthlyInterest = loanAmount * monthlyRate;

  if (type === 'IO') {
    return { payment: monthlyInterest, interest: monthlyInterest };
  }

  const factor = Math.pow(1 + monthlyRate, numPayments);
  const principalAndInterestPayment = monthlyInterest * factor / (factor - 1);
  return { payment: principalAndInterestPayment, interest: monthlyInterest };
}

export function updateAllRatios(housingData, settings) {
  const {
    interestRate,
    loanTermYears,
    depositPercent,
    depositAmount,
    depositType,
    mortgageType
  } = settings;

  const updatedData = { ...housingData };

  for (const postcode in updatedData) {
    const data = { ...updatedData[postcode] };
    const salesPrice = (data.yearly_median_sales_price_000s || 0) * 1000;
    const rent = data.yearly_median_weekly_rent;

    if (salesPrice) {
      const actualDeposit = depositType === 'percent'
        ? salesPrice * (depositPercent / 100)
        : depositAmount;

      const loanAmount = Math.max(0, salesPrice - actualDeposit);
      const mortgage = calculateMortgage(loanAmount, interestRate, loanTermYears, mortgageType);

      data.calculated_weekly_payment = mortgage.payment * 12 / 52;
      data.calculated_weekly_interest = mortgage.interest * 12 / 52;
      
      if (data.calculated_weekly_payment > 0) {
        data.interest_to_payment_ratio = data.calculated_weekly_interest / data.calculated_weekly_payment;
      } else {
        data.interest_to_payment_ratio = 0;
      }
      
      if (!rent) {
        data.rent_vs_payment_ratio = null;
      } else if (data.calculated_weekly_payment > 0) {
        data.rent_vs_payment_ratio = rent / data.calculated_weekly_payment;
      } else {
        data.rent_vs_payment_ratio = Infinity;
      }
      
      calculateQuartilePayments(data, depositType, depositPercent, depositAmount, interestRate, loanTermYears, mortgageType);
    }
    
    updatedData[postcode] = data;
  }

  return updatedData;
}

function calculateQuartilePayments(data, depositType, depositPercent, depositAmount, rate, term, type) {
  const q1Sales = (data.yearly_first_quartile_sales_000s || 0) * 1000;
  if (q1Sales) {
    const q1Deposit = depositType === 'percent'
      ? q1Sales * (depositPercent / 100)
      : depositAmount;
    const q1Loan = Math.max(0, q1Sales - q1Deposit);
    const q1Mortgage = calculateMortgage(q1Loan, rate, term, type);
    data.yearly_first_quartile_weekly_payment = q1Mortgage.payment * 12 / 52;
  } else {
    data.yearly_first_quartile_weekly_payment = null;
  }
  
  const q3Sales = (data.yearly_third_quartile_sales_000s || 0) * 1000;
  if (q3Sales) {
    const q3Deposit = depositType === 'percent'
      ? q3Sales * (depositPercent / 100)
      : depositAmount;
    const q3Loan = Math.max(0, q3Sales - q3Deposit);
    const q3Mortgage = calculateMortgage(q3Loan, rate, term, type);
    data.yearly_third_quartile_weekly_payment = q3Mortgage.payment * 12 / 52;
  } else {
    data.yearly_third_quartile_weekly_payment = null;
  }
}

export function getColor(ratio, interestToPaymentRatio = null) {
  if (ratio === null || isNaN(ratio)) return '#ccc';
  const interestThreshold = interestToPaymentRatio !== null && interestToPaymentRatio > 0 
    ? interestToPaymentRatio 
    : 0.75;
  
  if (ratio >= 1.0 || ratio === Infinity) return '#ef4444';
  if (ratio >= interestThreshold) return '#fbbf24';
  return '#22c55e';
}

export function getRepresentativeInterestRatio(interestRate, loanTermYears, mortgageType) {
  const REPRESENTATIVE_LOAN = 500000;
  
  if (interestRate > 0 && loanTermYears > 0 && mortgageType === 'PI') {
    const mortgage = calculateMortgage(REPRESENTATIVE_LOAN, interestRate, loanTermYears, mortgageType);
    const weeklyPayment = mortgage.payment * 12 / 52;
    const weeklyInterest = mortgage.interest * 12 / 52;
    if (weeklyPayment > 0) {
      return weeklyInterest / weeklyPayment;
    }
  }
  if (mortgageType === 'IO') {
    return 1.0;
  }
  return 0.75;
}

