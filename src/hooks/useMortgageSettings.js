import { useState, useCallback } from 'react';

export function useMortgageSettings() {
  const [mortgageType, setMortgageType] = useState('PI');
  const [interestRate, setInterestRate] = useState(5.3);
  const [loanTerm, setLoanTerm] = useState(30);
  const [depositType, setDepositType] = useState('percent');
  const [depositPercent, setDepositPercent] = useState(20);
  const [depositAmount, setDepositAmount] = useState(100000);

  const settings = {
    mortgageType,
    interestRate,
    loanTermYears: loanTerm,
    depositType,
    depositPercent,
    depositAmount
  };

  return {
    settings,
    mortgageType,
    setMortgageType,
    interestRate,
    setInterestRate,
    loanTerm,
    setLoanTerm,
    depositType,
    setDepositType,
    depositPercent,
    setDepositPercent,
    depositAmount,
    setDepositAmount
  };
}

