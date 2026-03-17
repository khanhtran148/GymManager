export type TransactionType =
  | "MembershipFee"
  | "SalaryPayment"
  | "Rent"
  | "Utilities"
  | "Equipment"
  | "Wages"
  | "Expense"
  | "Refund"
  | "Other";

export type TransactionDirection = "Credit" | "Debit";

export type TransactionCategory =
  | "Revenue"
  | "OperatingExpense"
  | "CapitalExpense"
  | "Payroll"
  | "Refund";

export type PaymentMethod = "Cash" | "BankTransfer" | "Card" | "Online";

export interface TransactionDto {
  id: string;
  gymHouseId: string;
  transactionType: TransactionType;
  direction: TransactionDirection;
  amount: number;
  category: TransactionCategory;
  description: string;
  transactionDate: string;
  relatedEntityId: string | null;
  reversesTransactionId: string | null;
  reversedByTransactionId: string | null;
  approvedById: string | null;
  paymentMethod: PaymentMethod | null;
  externalReference: string | null;
  createdAt: string;
}

export interface PnLLineDto {
  category: TransactionCategory;
  totalAmount: number;
}

export interface PnLReportDto {
  gymHouseId: string | null;
  from: string;
  to: string;
  incomeLines: PnLLineDto[];
  expenseLines: PnLLineDto[];
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
}

export interface RevenueMetricsDto {
  gymHouseId: string;
  from: string;
  to: string;
  mrr: number;
  churnRate: number;
  avgRevenuePerMember: number;
  totalRevenue: number;
  activeMembers: number;
  cancelledSubscriptions: number;
}

export interface RecordTransactionRequest {
  transactionType: TransactionType;
  direction: TransactionDirection;
  amount: number;
  category: TransactionCategory;
  description: string;
  transactionDate: string;
  relatedEntityId?: string;
  approvedById?: string;
  paymentMethod?: PaymentMethod;
  externalReference?: string;
}

export interface ReverseTransactionRequest {
  reason: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  direction?: TransactionDirection;
  from?: string;
  to?: string;
}
