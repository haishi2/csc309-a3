export enum Role {
  REGULAR = "REGULAR",
  CASHIER = "CASHIER",
  MANAGER = "MANAGER",
  SUPERUSER = "SUPERUSER",
}

export enum TransactionType {
  PURCHASE = "PURCHASE",
  ADJUSTMENT = "ADJUSTMENT",
  REDEMPTION = "REDEMPTION",
  TRANSFER = "TRANSFER",
  EVENT = "EVENT",
}

export enum TransactionStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum PromotionType {
  AUTOMATIC = "AUTOMATIC",
  ONE_TIME = "ONE_TIME",
}
