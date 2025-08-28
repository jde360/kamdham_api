import WithdrawalRequestModel from "../model/withdrawalRequest.model.js";
import WalletModel from "../../wallet/model/wallet.model.js";
import TransactionModel from "../../transaction/model/transaction.model.js";
import AdminWalletModel from "../../wallet/model/adminWallet.model.js";
import AppError from "../../../utils/error.js";
import { httpCode } from "../../../utils/httpCode.js";

class WithdrawalService {
  // Calculate platform fee (you can adjust this logic as needed)
  static calculatePlatformFee(amount) {
    const feePercentage = 0.05; // 5% platform fee
    return Math.round(amount * feePercentage * 100) / 100;
  }

  // Generate transaction ID
  static generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXNKDW-${timestamp}-${random}`;
  }

  // Validate payment details based on payment method
  static validatePaymentDetails(paymentMethod, paymentDetails) {
    const errors = [];

    switch (paymentMethod) {
      case "bank_transfer":
        if (!paymentDetails.bankName) errors.push("Bank name is required");
        if (!paymentDetails.accountNumber) errors.push("Account number is required");
        if (!paymentDetails.ifscCode) errors.push("IFSC code is required");
        if (!paymentDetails.accountHolderName) errors.push("Account holder name is required");
        break;

      case "upi":
        if (!paymentDetails.upiId) errors.push("UPI ID is required");
        break;

      case "paypal":
        if (!paymentDetails.paypalEmail) errors.push("PayPal email is required");
        break;

      case "other":
        if (!paymentDetails.otherDetails) errors.push("Payment details are required");
        break;
      default:
        errors.push("Invalid payment method");
    }

    return errors;
  }

  // Create withdrawal request
  static async createWithdrawalRequest(freelancerId, requestData) {
    const { amount, paymentMethod, paymentDetails } = requestData;

    const validationErrors = this.validatePaymentDetails(paymentMethod, paymentDetails);
    if (validationErrors.length > 0) {
      throw new AppError(validationErrors.join(", "), httpCode.BAD_REQUEST);
    }


    const wallet = await WalletModel.findOne({ freelancer: freelancerId });
    if (!wallet) {
      throw new AppError("Wallet not found", httpCode.NOT_FOUND);
    }

    if (wallet.balance < amount) {
      throw new AppError("Insufficient balance", httpCode.BAD_REQUEST);
    }

    const pendingRequests = await WithdrawalRequestModel.findOne({
      freelancer: freelancerId,
      status: "pending",
    });

    if (pendingRequests) {
      throw new AppError("You already have a pending withdrawal request", httpCode.CONFLICT);
    }

    // Calculate platform fee
    const platformFee = this.calculatePlatformFee(amount);
    const freelancerWallet = await WalletModel.findOne({ freelancer: freelancerId });

    // Create withdrawal request
    const withdrawalRequest =  WithdrawalRequestModel.create({
      requestId: this.generateTransactionId(),
      freelancer: freelancerId,
      amount:freelancerWallet.balance,
      requestedAmount: amount,
      platformFee,
      paymentMethod,
      paymentDetails,
    });

    return withdrawalRequest;
  }

  // Get withdrawal requests with pagination and filtering
  static async getWithdrawalRequests(filters, pagination) {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    const withdrawalRequests = await WithdrawalRequestModel.find(filters)
      .populate("freelancer", "name email phone")
      .populate("processedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await WithdrawalRequestModel.countDocuments(filters);

    return {
      requests: withdrawalRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalRequests: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Get withdrawal statistics
  static async getWithdrawalStats(filters = {}) {
    const stats = await WithdrawalRequestModel.aggregate([
      { $match: filters },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    return stats;
  }

  // Get single withdrawal request
  static async getWithdrawalRequestById(requestId, userRole, userId) {
    const withdrawalRequest = await WithdrawalRequestModel.findById(requestId)
      .populate("freelancer", "name email phone")
      .populate("processedBy", "name email")
      .populate("transactionId");

    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpCode.NOT_FOUND);
    }

    // Check authorization - freelancer can only view their own requests
    if (userRole === "freelancer" && withdrawalRequest.freelancer._id.toString() !== userId) {
      throw new AppError("Access denied", httpCode.FORBIDDEN);
    }

    return withdrawalRequest;
  }

  // Approve withdrawal request
  static async approveWithdrawalRequest(requestId, adminId, approvalData) {
    const { adminNotes, paymentReferenceId } = approvalData;

    // Find withdrawal request
    const withdrawalRequest = await WithdrawalRequestModel.findOne({requestId})
      .populate("freelancer", "name email");

    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpCode.NOT_FOUND);
    }

    if (withdrawalRequest.status !== "pending") {
      throw new AppError("Withdrawal request is not in pending status", httpCode.BAD_REQUEST);
    }

    // Check freelancer wallet balance
    const wallet = await WalletModel.findOne({ freelancer: withdrawalRequest.freelancer._id });
    if (!wallet || wallet.balance < withdrawalRequest.requestedAmount) {
      throw new AppError("Insufficient wallet balance", httpCode.BAD_REQUEST);
    }

    // Create transaction record
    const transaction = new TransactionModel({
      tnxId: this.generateTransactionId(),
      amount: withdrawalRequest.requestedAmount,
      platformFee: withdrawalRequest.platformFee,
      freelancer: withdrawalRequest.freelancer._id,
      admin: adminId,
      status: "completed",
      txnType: "debit",
      transactionType: "withdrawal",
      description: `Withdrawal request ${withdrawalRequest.requestId}`,
      withdrawalRequest: withdrawalRequest._id,
      paymentId: paymentReferenceId || "",
    });

    await transaction.save();

    // Update wallet balance
    wallet.balance -= withdrawalRequest.requestedAmount;
    wallet.transactions.push(transaction._id);
    await wallet.save();

    // Update admin wallet
    let adminWallet = await AdminWalletModel.findOne();
    if (!adminWallet) {
      adminWallet = new AdminWalletModel();
    }
    adminWallet.totalWithdrawals += withdrawalRequest.amount;
    adminWallet.currentBalance += withdrawalRequest.platformFee; // Platform fee goes to admin
    adminWallet.transactions.push(transaction._id);
    await adminWallet.save();

    // Update withdrawal request
    withdrawalRequest.status = "processed";
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.processedAt = new Date();
    withdrawalRequest.adminNotes = adminNotes || "";
    withdrawalRequest.transactionId = transaction._id;
    withdrawalRequest.paymentReferenceId = paymentReferenceId || "";

    await withdrawalRequest.save();

    return {
      withdrawalRequest,
      transaction,
    };
  }

  // Reject withdrawal request
  static async rejectWithdrawalRequest(requestId, adminId, rejectionData) {
    const { rejectionReason, adminNotes } = rejectionData;

    if (!rejectionReason) {
      throw new AppError("Rejection reason is required", httpCode.BAD_REQUEST);
    }

    // Find withdrawal request
    const withdrawalRequest = await WithdrawalRequestModel.findOne({requestId});

    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpCode.NOT_FOUND);
    }

    if (withdrawalRequest.status !== "pending") {
      throw new AppError("Withdrawal request is not in pending status", httpCode.BAD_REQUEST);
    }

    // Update withdrawal request
    withdrawalRequest.status = "rejected";
    withdrawalRequest.rejectionReason = rejectionReason;
    withdrawalRequest.adminNotes = adminNotes || "";
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.processedAt = new Date();

    await withdrawalRequest.save();
    return withdrawalRequest;
  }

  // Cancel withdrawal request
  static async cancelWithdrawalRequest(requestId, freelancerId) {
    const withdrawalRequest = await WithdrawalRequestModel.findOne({
      requestId,
      freelancer: freelancerId,
    });

    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpCode.NOT_FOUND);
    }

    if (withdrawalRequest.status !== "pending") {
      throw new AppError("Only pending withdrawal requests can be cancelled", httpCode.BAD_REQUEST);
    }

    withdrawalRequest.status = "cancelled";
    await withdrawalRequest.save();

    return withdrawalRequest;
  }

  // Get freelancer's withdrawal summary
  static async getFreelancerWithdrawalSummary(freelancerId) {
    const summary = await WithdrawalRequestModel.aggregate([
      { $match: { freelancer: freelancerId } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$requestedAmount" },
        },
      },
    ]);

    const totalRequested = await WithdrawalRequestModel.aggregate([
      { $match: { freelancer: freelancerId } },
      {
        $group: {
          _id: null,
          totalRequested: { $sum: "$requestedAmount" },
          totalProcessed: {
            $sum: {
              $cond: [{ $eq: ["$status", "processed"] }, "$requestedAmount", 0],
            },
          },
          totalPending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending"] }, "$requestedAmount", 0],
            },
          },
        },
      },
    ]);

    return {
      summary,
      totals: totalRequested[0] || {
        totalRequested: 0,
        totalProcessed: 0,
        totalPending: 0,
      },
    };
  }

  // Mark failed withdrawal (for future payment gateway integration)
  static async markWithdrawalAsFailed(requestId, adminId, failureReason) {
    const withdrawalRequest = await WithdrawalRequestModel.findById(requestId);

    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpCode.NOT_FOUND);
    }

    if (withdrawalRequest.status !== "approved") {
      throw new AppError("Only approved withdrawal requests can be marked as failed", httpCode.BAD_REQUEST);
    }

    withdrawalRequest.status = "failed";
    withdrawalRequest.adminNotes = failureReason;
    withdrawalRequest.processedBy = adminId;
    withdrawalRequest.processedAt = new Date();

    await withdrawalRequest.save();
    return withdrawalRequest;
  }

  // Retry failed withdrawal
  static async retryFailedWithdrawal(requestId, adminId) {
    const withdrawalRequest = await WithdrawalRequestModel.findById(requestId);

    if (!withdrawalRequest) {
      throw new AppError("Withdrawal request not found", httpCode.NOT_FOUND);
    }

    if (withdrawalRequest.status !== "failed") {
      throw new AppError("Only failed withdrawal requests can be retried", httpCode.BAD_REQUEST);
    }

    withdrawalRequest.status = "pending";
    withdrawalRequest.adminNotes = "Retry requested by admin";
    withdrawalRequest.processedBy = null;
    withdrawalRequest.processedAt = null;

    await withdrawalRequest.save();
    return withdrawalRequest;
  }
}

export default WithdrawalService;
